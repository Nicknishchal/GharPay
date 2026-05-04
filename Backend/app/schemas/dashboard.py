from pydantic import BaseModel
from typing import List, Dict
from app.schemas.lead import LeadResponse

class DashboardResponse(BaseModel):
    total_leads: int
    leads_by_status: Dict[str, int]
    upcoming_visits: List[LeadResponse]
    closed_leads: int
