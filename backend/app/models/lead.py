from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base
from datetime import datetime

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    phone = Column(String)
    email = Column(String)
    status = Column(String, default="New")
    urgency = Column(Integer, default=1)
    last_contacted = Column(DateTime, default=datetime.utcnow)