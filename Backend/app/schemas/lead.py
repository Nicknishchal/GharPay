from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.utils.pydantic_objectid import PyObjectId
from app.models.lead import LeadStatus

class LeadCreate(BaseModel):
    name: str
    phone: str = Field(..., pattern=r"^\+?1?\d{9,15}$", description="Valid phone number")
    budget: float = Field(..., gt=0)
    location: str
    notes: Optional[str] = None

class LeadResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    name: str
    phone: str
    budget: float
    location: str
    status: LeadStatus
    assigned_to: Optional[PyObjectId] = None
    visit_date: Optional[datetime]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {PyObjectId: str}

class LeadUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = Field(None, pattern=r"^\+?1?\d{9,15}$")
    budget: Optional[float] = Field(None, gt=0)
    location: Optional[str] = None
    notes: Optional[str] = None

class LeadStatusUpdate(BaseModel):
    status: LeadStatus

class LeadAssignUpdate(BaseModel):
    assigned_to: PyObjectId

class LeadScheduleVisit(BaseModel):
    visit_date: datetime

class LeadNotesUpdate(BaseModel):
    notes: str
