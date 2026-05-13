from sqlalchemy import Column, Integer, String
from app.database import Base

class Matter(Base):
    __tablename__ = "matters"

    id = Column(Integer, primary_key=True, index=True)

    client_name = Column(String, nullable=False)

    case_type = Column(String)

    assigned_attorney = Column(String)

    status = Column(String, default="Active")

    priority = Column(String, default="Medium")