from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class LeadCreate(BaseModel):
    full_name: str
    phone: str
    email: str
    status: Optional[str] = "New"
    urgency: Optional[int] = 1

class LeadResponse(BaseModel):
    id: int
    full_name: str
    phone: str
    email: str
    status: str
    urgency: int
    last_contacted: datetime

    class Config:
        from_attributes = True