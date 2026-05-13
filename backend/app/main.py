from app.models.audit import AuditLog
from fastapi import UploadFile, File
import fitz
import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import engine, Base, SessionLocal
from app.models.user import User
from app.models.lead import Lead
from app.models.matter import Matter

from app.schemas.lead import LeadCreate, LeadResponse
from app.schemas.matter import MatterCreate, MatterResponse
from app.schemas.user import (
    UserCreate,
    UserLogin
)

from app.auth import (
    hash_password,
    verify_password,
    create_access_token
)

Base.metadata.create_all(bind=engine)

app = FastAPI()
from datetime import datetime

def create_audit_log(
    db,
    action,
    entity,
    user="system"
):

    log = AuditLog(
        action=action,
        entity=entity,
        user=user,
        timestamp=str(datetime.utcnow())
    )

    db.add(log)
    db.commit()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Home Route
@app.get("/")
def home():
    return {"message": "LexFlow AI Backend Running"}

# Create Lead
@app.post("/leads", response_model=LeadResponse)
def create_lead(
    lead: LeadCreate,
    db: Session = Depends(get_db)
):
    new_lead = Lead(
        full_name=lead.full_name,
        phone=lead.phone,
        email=lead.email,
        status=lead.status,
        urgency=lead.urgency
    )

    db.add(new_lead)
    db.commit()
    db.refresh(new_lead)

    create_audit_log(
        db,
        "Lead Created",
        new_lead.full_name
    )

    return new_lead

# Get All Leads
@app.get("/leads", response_model=list[LeadResponse])
def get_leads(
    db: Session = Depends(get_db)
):
    return db.query(Lead).all()

# Update Lead Status
@app.patch("/leads/{lead_id}")
def update_lead_status(
    lead_id: int,
    status_data: dict,
    db: Session = Depends(get_db)
):
    lead = (
        db.query(Lead)
        .filter(Lead.id == lead_id)
        .first()
    )

    if not lead:
        return {"error": "Lead not found"}

    lead.status = status_data["status"]

    db.commit()
    db.refresh(lead)

    return lead

# Delete Lead
@app.delete("/leads/{lead_id}")
def delete_lead(
    lead_id: int,
    db: Session = Depends(get_db)
):
    lead = (
        db.query(Lead)
        .filter(Lead.id == lead_id)
        .first()
    )

    if not lead:
        return {"error": "Lead not found"}

    db.delete(lead)
    db.commit()

    return {"message": "Lead deleted successfully"}

@app.post("/matters", response_model=MatterResponse)
def create_matter(
    matter: MatterCreate,
    db: Session = Depends(get_db)
):
    new_matter = Matter(
        client_name=matter.client_name,
        case_type=matter.case_type,
        assigned_attorney=matter.assigned_attorney,
        status=matter.status,
        priority=matter.priority
    )

    db.add(new_matter)
    db.commit()
    db.refresh(new_matter)

    create_audit_log(
        db,
        "Matter Created",
        new_matter.client_name
    )

    return new_matter

# Get All Matters
@app.get("/matters", response_model=list[MatterResponse])
def get_matters(
    db: Session = Depends(get_db)
):
    return db.query(Matter).all()
# Upload + OCR Extraction
@app.post("/upload-document")
async def upload_document(
    file: UploadFile = File(...)
):
    file_location = f"app/uploads/{file.filename}"

    with open(file_location, "wb") as f:
        f.write(await file.read())

    # Extract PDF Text
    document = fitz.open(file_location)

    extracted_text = ""

    for page in document:
        extracted_text += page.get_text()

    return {
        "filename": file.filename,
        "extracted_text": extracted_text[:3000]
    }

# AI Document Summary
# AI Attorney Dossier
@app.post("/summarize-document")
async def summarize_document(
    file: UploadFile = File(...)
):
    os.makedirs("app/uploads", exist_ok=True)

    file_location = f"app/uploads/{file.filename}"

    with open(file_location, "wb") as f:
        f.write(await file.read())

    document = fitz.open(file_location)

    extracted_text = ""

    for page in document:
        extracted_text += page.get_text()

    extracted_text = extracted_text.strip()

    summary = extracted_text[:1200]

    # Simple AI-style heuristics
    lower_text = extracted_text.lower()

    case_type = "General Legal Intake"

    if "injury" in lower_text:
        case_type = "Personal Injury"

    elif "contract" in lower_text:
        case_type = "Contract Dispute"

    elif "employment" in lower_text:
        case_type = "Employment Law"

    elif "insurance" in lower_text:
        case_type = "Insurance Claim"

    urgency = "Low"

    if (
        "urgent" in lower_text
        or "immediately" in lower_text
        or "deadline" in lower_text
    ):
        urgency = "High"

    elif (
        "claim" in lower_text
        or "dispute" in lower_text
    ):
        urgency = "Medium"

    recommended_action = (
        "Attorney review recommended."
    )

    if urgency == "High":
        recommended_action = (
            "Immediate attorney consultation required."
        )

    missing_documents = [
        "Signed agreements",
        "Supporting evidence",
        "Client identification"
    ]

    return {
        "filename": file.filename,

        "summary": summary,

        "dossier": {
            "case_type": case_type,
            "urgency": urgency,
            "recommended_action": recommended_action,
            "missing_documents": missing_documents
        }
    }
# Register User
@app.post("/register")
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if existing_user:
        return {
            "error": "User already exists"
        }

    new_user = User(
        email=user.email,
        password=hash_password(
            user.password
        )
    )

    db.add(new_user)
    db.commit()

    return {
        "message": "User registered"
    }

# Login User
@app.post("/login")
def login_user(
    user: UserLogin,
    db: Session = Depends(get_db)
):
    existing_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if not existing_user:
        return {
            "error": "Invalid credentials"
        }

    valid_password = verify_password(
        user.password,
        existing_user.password
    )

    if not valid_password:
        return {
            "error": "Invalid credentials"
        }

    token = create_access_token({
        "sub": existing_user.email,
        "role": existing_user.role
    })

    return {
        "access_token": token,
        "token_type": "bearer"
    }
# Get Audit Logs
@app.get("/audit-logs")
def get_audit_logs(
    db: Session = Depends(get_db)
):
    return (
        db.query(AuditLog)
        .order_by(AuditLog.id.desc())
        .all()
    )