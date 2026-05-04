from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, Query, status
from app.schemas.lead import (
    LeadCreate, LeadResponse, LeadUpdate, 
    LeadStatusUpdate, LeadAssignUpdate, LeadScheduleVisit, LeadNotesUpdate
)
from app.services.lead_service import LeadService

router = APIRouter()

def get_lead_service() -> LeadService:
    return LeadService()

@router.post("", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
async def create_lead(
    data: LeadCreate, 
    service: LeadService = Depends(get_lead_service)
):
    return await service.create_lead(data)

@router.get("/grouped", response_model=Dict[str, List[LeadResponse]])
async def get_grouped_leads(
    service: LeadService = Depends(get_lead_service)
):
    return await service.get_grouped_leads()

@router.get("", response_model=List[LeadResponse])
async def get_leads(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    status: Optional[str] = None,
    assigned_to: Optional[str] = None,
    sort_by: str = Query("created_at", pattern="^(created_at|visit_date)$"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    service: LeadService = Depends(get_lead_service)
):
    return await service.get_leads(skip, limit, status, assigned_to, sort_by, order)

@router.get("/{id}", response_model=LeadResponse)
async def get_lead(
    id: str,
    service: LeadService = Depends(get_lead_service)
):
    return await service.get_lead(id)

@router.patch("/{id}/assign", response_model=LeadResponse)
async def assign_owner(
    id: str,
    data: LeadAssignUpdate,
    service: LeadService = Depends(get_lead_service)
):
    return await service.assign_owner(id, str(data.assigned_to))

@router.patch("/{id}/status", response_model=LeadResponse)
async def update_status(
    id: str,
    data: LeadStatusUpdate,
    service: LeadService = Depends(get_lead_service)
):
    return await service.update_status(id, data.status)

@router.patch("/{id}/schedule", response_model=LeadResponse)
async def schedule_visit(
    id: str,
    data: LeadScheduleVisit,
    service: LeadService = Depends(get_lead_service)
):
    return await service.schedule_visit(id, data.visit_date)

@router.patch("/{id}", response_model=LeadResponse)
async def update_lead(
    id: str,
    data: LeadUpdate,
    service: LeadService = Depends(get_lead_service)
):
    return await service.update_lead(id, data)

@router.patch("/{id}/notes", response_model=LeadResponse)
async def update_notes(
    id: str,
    data: LeadNotesUpdate,
    service: LeadService = Depends(get_lead_service)
):
    return await service.update_notes(id, data.notes)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lead(
    id: str,
    service: LeadService = Depends(get_lead_service)
):
    await service.delete_lead(id)
