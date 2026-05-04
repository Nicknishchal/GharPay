from typing import List
from fastapi import APIRouter, Depends
from app.schemas.user import UserResponse, UserCreate
from app.services.user_service import UserService

router = APIRouter()

def get_user_service() -> UserService:
    return UserService()

@router.get("", response_model=List[UserResponse])
async def get_users(
    service: UserService = Depends(get_user_service)
):
    return await service.get_users()

@router.post("", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    service: UserService = Depends(get_user_service)
):
    return await service.create_user(user_data)
