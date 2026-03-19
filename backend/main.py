from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, Header, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import uvicorn
import csv
import io

import models
from database import engine, get_db
from pydantic import BaseModel
from datetime import datetime

from scraper import search_leads, send_whatsapp_message, check_whatsapp

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Prospector.AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== SCHEMAS =====
class UserAuth(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    serpapi_key: Optional[str] = None
    zapi_instance: Optional[str] = None
    zapi_token: Optional[str] = None
    class Config:
        from_attributes = True

class UserSettingsUpdate(BaseModel):
    serpapi_key: Optional[str] = None
    zapi_instance: Optional[str] = None
    zapi_token: Optional[str] = None

class ProjectCreate(BaseModel):
    name: str
    country: Optional[str] = "Brasil"
    state: Optional[str] = ""
    city: Optional[str] = ""
    keyword: Optional[str] = ""

class ProjectResponse(BaseModel):
    id: int
    name: str
    country: str
    state: str
    city: str
    keyword: str
    user_id: int
    created_at: datetime
    scraping_status: str
    scraping_progress: int
    class Config:
        from_attributes = True

class LeadUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[str] = None
    status: Optional[str] = None

class LeadMove(BaseModel):
    column_id: int

class SendMessageRequest(BaseModel):
    message: str

class AutomationCreate(BaseModel):
    name: str = "Nova Automacao"
    flow_json: str = "{}"

class AutomationUpdate(BaseModel):
    name: Optional[str] = None
    flow_json: Optional[str] = None
    active: Optional[bool] = None

# ===== AUTH =====
@app.post("/auth/register", response_model=UserResponse)
def register_user(user: UserAuth, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = models.User(email=user.email, password=user.password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/auth/login", response_model=UserResponse)
def login_user(user: UserAuth, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(
        models.User.email == user.email,
        models.User.password == user.password
    ).first()
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return db_user

# ===== USER SETTINGS =====
@app.put("/users/{user_id}/settings", response_model=UserResponse)
def update_settings(user_id: int, settings: UserSettingsUpdate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if settings.serpapi_key is not None:
        db_user.serpapi_key = settings.serpapi_key
    if settings.zapi_instance is not None:
        db_user.zapi_instance = settings.zapi_instance
    if settings.zapi_token is not None:
        db_user.zapi_token = settings.zapi_token
    db.commit()
    db.refresh(db_user)
    return db_user

# ===== PROJECTS =====
DEFAULT_COLUMNS = [
    "1. Contato Inicial",
    "2. Responderam",
    "3. Qualificados",
    "4. Reuniao Agendada",
    "5. Follow Up",
    "6. Proposta Enviada",
    "7. Negociacao",
    "8. Fechamento",
    "9. Ganho",
    "10. Perdido"
]

@app.post("/projects", response_model=ProjectResponse)
def create_project(project: ProjectCreate, background_tasks: BackgroundTasks, x_user_id: int = Header(..., alias="X-User-Id"), db: Session = Depends(get_db)):
    db_project = models.Project(**project.model_dump(), user_id=x_user_id, scraping_status="running", scraping_progress=0)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    inbox = models.KanbanColumn(project_id=db_project.id, title="0. Leads Novos", position=-1)
    db.add(inbox)
    for idx, col_name in enumerate(DEFAULT_COLUMNS):
        col = models.KanbanColumn(project_id=db_project.id, title=col_name, position=idx)
        db.add(col)
    db.commit()

    # Iniciar busca automaticamente ao criar o projeto
    background_tasks.add_task(
        search_leads, db_project.id, db_project.keyword, db_project.country, db_project.state, db_project.city, db_project.user_id
    )

    return db_project

@app.get("/projects", response_model=List[ProjectResponse])
def get_projects(x_user_id: int = Header(..., alias="X-User-Id"), db: Session = Depends(get_db)):
    return db.query(models.Project).filter(models.Project.user_id == x_user_id).order_by(models.Project.created_at.desc()).all()

@app.delete("/projects/{project_id}")
def delete_project(project_id: int, x_user_id: int = Header(..., alias="X-User-Id"), db: Session = Depends(get_db)):
    proj = db.query(models.Project).filter(models.Project.id == project_id, models.Project.user_id == x_user_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(proj)
    db.commit()
    return {"status": "deleted"}

# ===== KANBAN =====
@app.get("/projects/{project_id}/kanban")
def get_kanban(project_id: int, db: Session = Depends(get_db)):
    columns = db.query(models.KanbanColumn).filter(
        models.KanbanColumn.project_id == project_id
    ).order_by(models.KanbanColumn.position).all()
    result = []
    for c in columns:
        leads = db.query(models.Lead).filter(models.Lead.column_id == c.id).all()
        result.append({
            "id": str(c.id),
            "title": c.title,
            "leads": [{
                "id": str(l.id), "name": l.name, "phone": l.phone,
                "email": l.email, "website": l.website, "address": l.address,
                "has_whatsapp": l.has_whatsapp, "notes": l.notes,
                "tags": l.tags, "status": l.status, "rating": l.rating,
                "created_at": str(l.created_at) if l.created_at else ""
            } for l in leads]
        })
    return result

# ===== LEADS =====
@app.get("/projects/{project_id}/leads")
def get_leads(project_id: int, search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Lead).filter(models.Lead.project_id == project_id)
    if search:
        query = query.filter(
            (models.Lead.name.ilike(f"%{search}%")) |
            (models.Lead.phone.ilike(f"%{search}%")) |
            (models.Lead.email.ilike(f"%{search}%"))
        )
    leads = query.order_by(models.Lead.created_at.desc()).all()
    return [{
        "id": l.id, "name": l.name, "phone": l.phone, "email": l.email,
        "website": l.website, "address": l.address, "rating": l.rating,
        "has_whatsapp": l.has_whatsapp, "notes": l.notes, "tags": l.tags,
        "status": l.status, "column_id": l.column_id,
        "created_at": str(l.created_at) if l.created_at else ""
    } for l in leads]

@app.put("/leads/{lead_id}")
def update_lead(lead_id: int, data: LeadUpdate, db: Session = Depends(get_db)):
    lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(lead, field, value)
    db.commit()
    db.refresh(lead)
    return {"status": "updated"}

@app.delete("/leads/{lead_id}")
def delete_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    db.delete(lead)
    db.commit()
    return {"status": "deleted"}

@app.post("/leads/{lead_id}/move")
def move_lead(lead_id: int, data: LeadMove, db: Session = Depends(get_db)):
    lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    lead.column_id = data.column_id
    db.commit()
    return {"status": "moved"}

# ===== SCRAPING =====
@app.post("/projects/{project_id}/scrape")
def trigger_scrape(project_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    proj = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    
    proj.scraping_status = "running"
    proj.scraping_progress = 0
    db.commit()

    background_tasks.add_task(
        search_leads, project_id, proj.keyword, proj.country, proj.state, proj.city, proj.user_id
    )
    return {"status": "Busca iniciada."}

@app.get("/projects/{project_id}/status")
def get_status(project_id: int, db: Session = Depends(get_db)):
    proj = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"status": proj.scraping_status, "progress": proj.scraping_progress}

# ===== CSV IMPORT =====
@app.post("/projects/{project_id}/import-csv")
async def import_csv(project_id: int, db: Session = Depends(get_db), file: UploadFile = File(...)):
    inbox = db.query(models.KanbanColumn).filter(
        models.KanbanColumn.project_id == project_id,
        models.KanbanColumn.position == -1
    ).first()
    if not inbox:
        raise HTTPException(status_code=404, detail="Inbox column not found")

    content = await file.read()
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    count = 0
    for row in reader:
        def get_val(*keys):
            for k in keys:
                if k in row: return row[k]
                if k.lower() in [key.lower() for key in row.keys()]:
                    return next(v for key, v in row.items() if key.lower() == k.lower())
            return ""

        lead = models.Lead(
            project_id=project_id,
            column_id=inbox.id,
            name=get_val("name", "nome", "empresa", "first_name"),
            phone=get_val("phone", "telefone", "tel", "celular"),
            email=get_val("email", "e-mail"),
            website=get_val("website", "site", "url"),
            address=get_val("address", "endereco", "endereço"),
            notes=get_val("notes", "notas", "observacoes"),
        )
        db.add(lead)
        count += 1
    db.commit()
    return {"status": f"{count} leads importados"}

# ===== WHATSAPP =====
@app.post("/leads/{lead_id}/send-whatsapp")
def send_wa_message(lead_id: int, data: SendMessageRequest, x_user_id: int = Header(..., alias="X-User-Id"), db: Session = Depends(get_db)):
    lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    user = db.query(models.User).filter(models.User.id == x_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not lead.phone:
        raise HTTPException(status_code=400, detail="Lead has no phone number")
    result = send_whatsapp_message(lead.phone, data.message, user.zapi_instance, user.zapi_token)
    if result["success"]:
        msg = models.Message(lead_id=lead_id, direction="out", content=data.message)
        db.add(msg)
        db.commit()
    return result

@app.get("/leads/{lead_id}/messages")
def get_messages(lead_id: int, db: Session = Depends(get_db)):
    msgs = db.query(models.Message).filter(models.Message.lead_id == lead_id).order_by(models.Message.sent_at).all()
    return [{"id": m.id, "direction": m.direction, "content": m.content, "sent_at": str(m.sent_at)} for m in msgs]

# ===== AUTOMATIONS =====
@app.get("/projects/{project_id}/automations")
def get_automations(project_id: int, db: Session = Depends(get_db)):
    autos = db.query(models.Automation).filter(models.Automation.project_id == project_id).all()
    return [{"id": a.id, "name": a.name, "flow_json": a.flow_json, "active": a.active, "created_at": str(a.created_at)} for a in autos]

@app.post("/projects/{project_id}/automations")
def create_automation(project_id: int, data: AutomationCreate, db: Session = Depends(get_db)):
    auto = models.Automation(project_id=project_id, name=data.name, flow_json=data.flow_json)
    db.add(auto)
    db.commit()
    db.refresh(auto)
    return {"id": auto.id, "name": auto.name}

@app.put("/automations/{auto_id}")
def update_automation(auto_id: int, data: AutomationUpdate, db: Session = Depends(get_db)):
    auto = db.query(models.Automation).filter(models.Automation.id == auto_id).first()
    if not auto:
        raise HTTPException(status_code=404, detail="Automation not found")
    if data.name is not None:
        auto.name = data.name
    if data.flow_json is not None:
        auto.flow_json = data.flow_json
    if data.active is not None:
        auto.active = data.active
    db.commit()
    return {"status": "updated"}

@app.delete("/automations/{auto_id}")
def delete_automation(auto_id: int, db: Session = Depends(get_db)):
    auto = db.query(models.Automation).filter(models.Automation.id == auto_id).first()
    if not auto:
        raise HTTPException(status_code=404, detail="Automation not found")
    db.delete(auto)
    db.commit()
    return {"status": "deleted"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
