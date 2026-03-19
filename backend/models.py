from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    
    serpapi_key = Column(String, nullable=True)
    zapi_instance = Column(String, nullable=True)
    zapi_token = Column(String, nullable=True)

    projects = relationship("Project", back_populates="owner")

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    country = Column(String, default="Brasil")
    state = Column(String, default="")
    city = Column(String, default="")
    keyword = Column(String, default="")
    
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Scraping Tracker Fields
    scraping_status = Column(String, default="idle")
    scraping_progress = Column(Integer, default=0)

    owner = relationship("User", back_populates="projects")
    kanban_columns = relationship("KanbanColumn", back_populates="project", cascade="all, delete-orphan")
    leads = relationship("Lead", back_populates="project", cascade="all, delete-orphan")
    automations = relationship("Automation", back_populates="project", cascade="all, delete-orphan")

class KanbanColumn(Base):
    __tablename__ = "kanban_columns"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    title = Column(String)
    position = Column(Integer)

    project = relationship("Project", back_populates="kanban_columns")
    leads = relationship("Lead", back_populates="column", cascade="all, delete-orphan")

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    column_id = Column(Integer, ForeignKey("kanban_columns.id"))
    
    name = Column(String)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    website = Column(String, nullable=True)
    address = Column(String, nullable=True)
    rating = Column(String, nullable=True)

    has_whatsapp = Column(Boolean, default=False)
    whatsapp_checked = Column(Boolean, default=False)

    notes = Column(Text, nullable=True)
    tags = Column(String, nullable=True)
    status = Column(String, nullable=True) 

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="leads")
    column = relationship("KanbanColumn", back_populates="leads")
    messages = relationship("Message", back_populates="lead", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"))
    direction = Column(String) 
    content = Column(Text)
    sent_at = Column(DateTime, default=datetime.datetime.utcnow)

    lead = relationship("Lead", back_populates="messages")

class Automation(Base):
    __tablename__ = "automations"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    name = Column(String)
    flow_json = Column(Text) 
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="automations")
