from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field
from app.utils.pydantic_objectid import PyObjectId
from enum import Enum

class LeadStatus(str, Enum):
    NEW = "NEW"
    CONTACTED = "CONTACTED"
    VISIT_SCHEDULED = "VISIT_SCHEDULED"
    CLOSED = "CLOSED"

def get_utcnow() -> datetime:
    return datetime.now(timezone.utc)

class LeadDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    name: str
    phone: str
    budget: float
    location: str
    status: LeadStatus = LeadStatus.NEW
    assigned_to: Optional[PyObjectId] = None
    visit_date: Optional[datetime] = None
    notes: Optional[str] = None
    is_deleted: bool = False
    created_at: datetime = Field(default_factory=get_utcnow)
    updated_at: datetime = Field(default_factory=get_utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {PyObjectId: str}
