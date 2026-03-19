import os
import requests
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Lead, KanbanColumn, Project, User
from dotenv import load_dotenv

load_dotenv()

def check_whatsapp(phone: str, zapi_instance: str, zapi_token: str) -> bool:
    if not phone or not zapi_instance or not zapi_token:
        return False
    clean_phone = ''.join(filter(str.isdigit, phone))
    if len(clean_phone) < 8:
        return False
    if not clean_phone.startswith("55") and len(clean_phone) in [10, 11]:
        clean_phone = "55" + clean_phone
    url = f'https://api.z-api.io/instances/{zapi_instance}/token/{zapi_token}/phone-exists/{clean_phone}'
    try:
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            return data.get('exists', False)
    except Exception as e:
        print(f'[WA CHECK] Error for {phone}: {e}')
    return False

def send_whatsapp_message(phone: str, message: str, zapi_instance: str, zapi_token: str):
    if not phone or not zapi_instance or not zapi_token:
        return {'success': False, 'error': 'Missing Z-API credentials'}
    clean_phone = ''.join(filter(str.isdigit, phone))
    if not clean_phone.startswith("55") and len(clean_phone) in [10, 11]:
        clean_phone = "55" + clean_phone
    url = f'https://api.z-api.io/instances/{zapi_instance}/token/{zapi_token}/send-text'
    payload = {'phone': clean_phone, 'message': message}
    try:
        resp = requests.post(url, json=payload, timeout=10)
        if resp.status_code == 200:
            return {'success': True, 'data': resp.json()}
        return {'success': False, 'error': f'Status {resp.status_code}'}
    except Exception as e:
        return {'success': False, 'error': str(e)}

def search_leads(project_id: int, keyword: str, country: str, state: str, city: str, user_id: int):
    db: Session = SessionLocal()
    proj = None
    try:
        proj = db.query(Project).filter(Project.id == project_id).first()
        if not proj:
            print("[SCRAPER] Project not found.")
            return

        proj.scraping_status = "running"
        db.commit()

        user = db.query(User).filter(User.id == user_id).first()
        
        serpapi_key = (user.serpapi_key if user else None) or os.getenv("SERPAPI_KEY")
        zapi_instance = (user.zapi_instance if user else None) or os.getenv("ZAPI_INSTANCE")
        zapi_token = (user.zapi_token if user else None) or os.getenv("ZAPI_TOKEN")

        if not serpapi_key:
            proj.scraping_status = "error"
            db.commit()
            print('[SCRAPER] No SERPAPI key configured. Aborting.')
            return

        inbox_column = db.query(KanbanColumn).filter(
            KanbanColumn.project_id == project_id,
            KanbanColumn.position == -1
        ).first()
        
        if not inbox_column:
            proj.scraping_status = "error"
            db.commit()
            print("[SCRAPER] Inbox not found.")
            return

        location_parts = [p for p in [city, state, country] if p and p != "Qualquer estado"]
        location_str = ', '.join(location_parts)
        search_query = f'{keyword} in {location_str}' if location_str else keyword

        print(f'[SCRAPER] Searching: {search_query}')

        existing_phones = set()
        existing_leads = db.query(Lead).filter(Lead.project_id == project_id).all()
        for el in existing_leads:
            if el.phone:
                existing_phones.add(''.join(filter(str.isdigit, el.phone)))

        url = 'https://serpapi.com/search.json'
        
        TARGET_LEADS = 20
        total_inserted = 0
        start = 0
        pages_without_results = 0

        while total_inserted < TARGET_LEADS and pages_without_results < 2:
            params = {
                'engine': 'google_maps',
                'q': search_query,
                'hl': 'pt-br' if country.lower() == 'brasil' else 'en',
                'api_key': serpapi_key,
                'start': start
            }

            try:
                response = requests.get(url, params=params, timeout=30)
                if response.status_code == 200:
                    data = response.json()
                    results = data.get('local_results', [])
                    
                    if not results:
                        pages_without_results += 1
                        start += 20
                        continue
                    
                    pages_without_results = 0
                    inserted_this_page = 0
                    
                    for res in results:
                        if total_inserted >= TARGET_LEADS:
                            break
                            
                        phone = res.get('phone', '')
                        clean = ''.join(filter(str.isdigit, phone)) if phone else ''
                        if clean and clean in existing_phones:
                            continue
                        if clean:
                            existing_phones.add(clean)

                        has_wa = False
                        if phone and zapi_instance and zapi_token:
                            has_wa = check_whatsapp(phone, zapi_instance, zapi_token)

                        lead = Lead(
                            project_id=project_id, column_id=inbox_column.id,
                            name=res.get('title', res.get('name', 'Sem Nome')),
                            phone=phone,
                            email=res.get('email', ''), 
                            address=res.get('address', ''),
                            website=res.get('website', res.get('link', '')),
                            rating=str(res.get('rating', '')),
                            has_whatsapp=has_wa,
                            whatsapp_checked=bool(phone)
                        )
                        db.add(lead)
                        inserted_this_page += 1
                        total_inserted += 1

                        current_progress = int((total_inserted / TARGET_LEADS) * 100)
                        if current_progress > proj.scraping_progress:
                            proj.scraping_progress = min(100, current_progress)
                            db.commit()

                    print(f'[SCRAPER] Added {inserted_this_page} leads. Total: {total_inserted}')
                    start += 20
                else:
                    print(f'[SCRAPER] SerpAPI error: {response.status_code}')
                    break
            except Exception as e:
                print(f'[SCRAPER] Request error: {e}')
                break
                
        # Finaliza
        proj.scraping_status = "completed"
        proj.scraping_progress = 100
        db.commit()
        print(f'[SCRAPER] Process finished. Total leads created: {total_inserted}')
        
    except Exception as outer_e:
        print(f"[SCRAPER] Fatal error: {outer_e}")
        if proj:
            proj.scraping_status = "error"
            db.commit()
    finally:
        db.close()
