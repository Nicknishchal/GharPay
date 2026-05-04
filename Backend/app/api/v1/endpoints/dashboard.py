from fastapi import APIRouter, Depends
from app.schemas.dashboard import DashboardResponse
from app.services.dashboard_service import DashboardService

router = APIRouter()

def get_dashboard_service() -> DashboardService:
    return DashboardService()

@router.get("", response_model=DashboardResponse)
async def get_dashboard(
    service: DashboardService = Depends(get_dashboard_service)
):
    return await service.get_dashboard_stats()
