from datetime import datetime, timedelta, timezone
from app.repositories.lead_repository import LeadRepository
from app.schemas.dashboard import DashboardResponse
from app.schemas.lead import LeadResponse

class DashboardService:
    def __init__(self):
        self.lead_repo = LeadRepository()

    async def get_dashboard_stats(self) -> DashboardResponse:
        total_leads = await self.lead_repo.get_total_leads()
        
        status_counts_raw = await self.lead_repo.get_leads_per_status()
        leads_by_status = {
            item["_id"]: item["count"]
            for item in status_counts_raw
        }

        now = datetime.now(timezone.utc)
        next_week = now + timedelta(days=7)
        upcoming_visits_db = await self.lead_repo.get_upcoming_visits(now, next_week)

        # Convert LeadDB ODM objects → LeadResponse Pydantic schemas.
        # Pydantic v2 does not auto-coerce between unrelated model types,
        # so we serialise each document (preserving _id alias) then validate.
        upcoming_visits = [
            LeadResponse.model_validate(lead.model_dump(by_alias=True))
            for lead in upcoming_visits_db
        ]

        closed_leads = await self.lead_repo.get_closed_leads_count()

        return DashboardResponse(
            total_leads=total_leads,
            leads_by_status=leads_by_status,
            upcoming_visits=upcoming_visits,
            closed_leads=closed_leads
        )
