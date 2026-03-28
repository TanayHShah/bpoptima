import uuid
from sqlalchemy import Column, String, DateTime, JSON
from sqlalchemy.sql import func
from app.db.base import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    status = Column(String, default="queued")
    file_url = Column(String, nullable=True)
    webhook_url = Column(String, nullable=True)
    result = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)