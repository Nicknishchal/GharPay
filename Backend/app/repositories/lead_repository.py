from datetime import datetime
from typing import List, Optional, Dict, Any
from bson import ObjectId
from app.db.mongodb import db
from app.models.lead import LeadDB

class LeadRepository:
    @property
    def collection(self):
        return db.db.leads

    async def create(self, lead: LeadDB) -> LeadDB:
        result = await self.collection.insert_one(lead.model_dump(by_alias=True))
        lead.id = result.inserted_id
        return lead

    async def get_by_id(self, lead_id: str) -> Optional[LeadDB]:
        ids = [lead_id]
        if ObjectId.is_valid(lead_id):
            ids.append(ObjectId(lead_id))
            
        doc = await self.collection.find_one({"_id": {"$in": ids}, "is_deleted": {"$ne": True}})
        if doc:
            return LeadDB(**doc)
        return None

    async def get_all(
        self, skip: int = 0, limit: int = 10, filters: Dict[str, Any] = None, sort_by: str = "created_at", order: str = "desc"
    ) -> List[LeadDB]:
        if filters is None:
            filters = {}
        filters["is_deleted"] = {"$ne": True}
        
        sort_dir = -1 if order == "desc" else 1
        
        cursor = self.collection.find(filters).sort(sort_by, sort_dir).skip(skip).limit(limit)
        leads = []
        async for doc in cursor:
            leads.append(LeadDB(**doc))
        return leads

    async def update(self, lead_id: str, update_data: Dict[str, Any]) -> Optional[LeadDB]:
        ids = [lead_id]
        if ObjectId.is_valid(lead_id):
            ids.append(ObjectId(lead_id))
            
        result = await self.collection.update_one(
            {"_id": {"$in": ids}},
            {"$set": update_data}
        )
        if result.modified_count > 0:
            return await self.get_by_id(lead_id)
        return None

    async def get_total_leads(self) -> int:
        return await self.collection.count_documents({"is_deleted": {"$ne": True}})

    async def get_leads_per_status(self) -> List[Dict[str, Any]]:
        pipeline = [
            {"$match": {"is_deleted": {"$ne": True}}},
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ]
        cursor = self.collection.aggregate(pipeline)
        return await cursor.to_list(length=None)

    async def get_upcoming_visits(self, start_date: datetime, end_date: datetime) -> List[LeadDB]:
        cursor = self.collection.find({
            "visit_date": {"$gte": start_date, "$lte": end_date},
            "status": "VISIT_SCHEDULED",
            "is_deleted": {"$ne": True}
        }).sort("visit_date", 1)
        
        leads = []
        async for doc in cursor:
            leads.append(LeadDB(**doc))
        return leads

    async def get_closed_leads_count(self) -> int:
        return await self.collection.count_documents({"status": "CLOSED", "is_deleted": {"$ne": True}})
