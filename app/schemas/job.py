from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

class JobResponse(BaseModel):
    id: str
    status: str
    file_url: Optional[str] = None
    result: Optional[Any] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    webhook_url: Optional[str] = None

    class Config:
        from_attributes = True
