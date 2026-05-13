from sqlalchemy import (
    Column,
    Integer,
    String
)

from app.database import Base

class AuditLog(Base):

    __tablename__ = "audit_logs"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    action = Column(String)

    entity = Column(String)

    user = Column(String)

    timestamp = Column(String)