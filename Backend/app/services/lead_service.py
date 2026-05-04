from datetime import datetime, timezone
from typing import List, Optional, Dict
from bson import ObjectId
from app.repositories.lead_repository import LeadRepository
from app.repositories.user_repository import UserRepository
from app.models.lead import LeadDB, LeadStatus
from app.schemas.lead import LeadCreate, LeadUpdate
from app.core.exceptions import APIException
from fastapi import status

class LeadService:
    def __init__(self):
        self.lead_repo = LeadRepository()
        self.user_repo = UserRepository()

    async def create_lead(self, data: LeadCreate) -> LeadDB:
        lead = LeadDB(
            name=data.name,
            phone=data.phone,
            budget=data.budget,
            location=data.location,
            notes=data.notes,
            status=LeadStatus.NEW,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        return await self.lead_repo.create(lead)

    async def get_leads(
        self, skip: int = 0, limit: int = 10, status_filter: Optional[str] = None, assigned_to: Optional[str] = None,
        sort_by: str = "created_at", order: str = "desc"
    ) -> List[LeadDB]:
        filters = {}
        if status_filter:
            filters["status"] = status_filter
        if assigned_to:
            ids = [assigned_to]
            if ObjectId.is_valid(assigned_to):
                ids.append(ObjectId(assigned_to))
            filters["assigned_to"] = {"$in": ids}
                
        valid_sort_fields = {"created_at", "visit_date"}
        if sort_by not in valid_sort_fields:
            sort_by = "created_at"
            
        valid_orders = {"asc", "desc"}
        if order not in valid_orders:
            order = "desc"

        return await self.lead_repo.get_all(skip=skip, limit=limit, filters=filters, sort_by=sort_by, order=order)

    async def get_grouped_leads(self) -> Dict[str, List[LeadDB]]:
        leads = await self.lead_repo.get_all(limit=1000)
        grouped = {
            LeadStatus.NEW.value: [],
            LeadStatus.CONTACTED.value: [],
            LeadStatus.VISIT_SCHEDULED.value: [],
            LeadStatus.CLOSED.value: []
        }
        for lead in leads:
            grouped[lead.status.value].append(lead)
        return grouped

    async def get_lead(self, lead_id: str) -> LeadDB:
        if not ObjectId.is_valid(lead_id):
            raise APIException(status_code=status.HTTP_400_BAD_REQUEST, message="Invalid lead ID")
        lead = await self.lead_repo.get_by_id(lead_id)
        if not lead:
            raise APIException(status_code=status.HTTP_404_NOT_FOUND, message="Lead not found")
        return lead

    def _check_readonly(self, lead: LeadDB):
        if lead.status == LeadStatus.CLOSED:
            raise APIException(status_code=status.HTTP_400_BAD_REQUEST, message="Closed leads are read-only")

    async def update_lead(self, lead_id: str, data: LeadUpdate) -> LeadDB:
        lead = await self.get_lead(lead_id)
        
        update_data = data.model_dump(exclude_unset=True)
        
        if lead.status == LeadStatus.CLOSED:
            allowed_keys = {"notes"}
            if any(k not in allowed_keys for k in update_data.keys()):
                raise APIException(status_code=status.HTTP_400_BAD_REQUEST, message="Closed leads are read-only (except notes)")

        if not update_data:
            return lead

        update_data["updated_at"] = datetime.now(timezone.utc)
        updated_lead = await self.lead_repo.update(lead_id, update_data)
        return updated_lead

    async def assign_owner(self, lead_id: str, assigned_to: str) -> LeadDB:
        lead = await self.get_lead(lead_id)
        self._check_readonly(lead)

        if not ObjectId.is_valid(assigned_to):
            raise APIException(status_code=status.HTTP_400_BAD_REQUEST, message="Invalid user ID")
        
        user = await self.user_repo.get_by_id(assigned_to)
        if not user:
            raise APIException(status_code=status.HTTP_404_NOT_FOUND, message="User not found")

        updated_lead = await self.lead_repo.update(lead_id, {
            "assigned_to": assigned_to,
            "updated_at": datetime.now(timezone.utc)
        })
        return updated_lead

    async def update_status(self, lead_id: str, new_status: LeadStatus) -> LeadDB:
        lead = await self.get_lead(lead_id)
        if lead.status == LeadStatus.CLOSED:
            raise APIException(status_code=status.HTTP_400_BAD_REQUEST, message="Cannot update status of a closed lead")

        status_order = {
            LeadStatus.NEW: 0,
            LeadStatus.CONTACTED: 1,
            LeadStatus.VISIT_SCHEDULED: 2,
            LeadStatus.CLOSED: 3
        }

        if status_order[new_status] < status_order[lead.status]:
            raise APIException(status_code=status.HTTP_400_BAD_REQUEST, message="Cannot move backward in pipeline")

        if new_status == LeadStatus.VISIT_SCHEDULED and not lead.assigned_to:
            raise APIException(status_code=status.HTTP_400_BAD_REQUEST, message="Cannot move to VISIT_SCHEDULED without an assigned owner")

        updated_lead = await self.lead_repo.update(lead_id, {
            "status": new_status,
            "updated_at": datetime.now(timezone.utc)
        })
        return updated_lead

    async def schedule_visit(self, lead_id: str, visit_date: datetime) -> LeadDB:
        lead = await self.get_lead(lead_id)
        self._check_readonly(lead)

        if not lead.assigned_to:
            raise APIException(status_code=status.HTTP_400_BAD_REQUEST, message="Cannot schedule visit without assigned owner")

        now = datetime.now(timezone.utc) if visit_date.tzinfo else datetime.now()
        if visit_date <= now:
            raise APIException(status_code=status.HTTP_400_BAD_REQUEST, message="Visit date must be in the future")

        updated_lead = await self.lead_repo.update(lead_id, {
            "visit_date": visit_date,
            "status": LeadStatus.VISIT_SCHEDULED,
            "updated_at": datetime.now(timezone.utc)
        })
        return updated_lead

    async def update_notes(self, lead_id: str, notes: str) -> LeadDB:
        lead = await self.get_lead(lead_id)
        updated_lead = await self.lead_repo.update(lead_id, {
            "notes": notes,
            "updated_at": datetime.now(timezone.utc)
        })
        return updated_lead

    async def delete_lead(self, lead_id: str) -> bool:
        lead = await self.get_lead(lead_id)
        await self.lead_repo.update(lead_id, {
            "is_deleted": True,
            "updated_at": datetime.now(timezone.utc)
        })
        return True
