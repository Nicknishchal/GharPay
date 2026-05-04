from typing import List
from app.repositories.user_repository import UserRepository
from app.models.user import UserDB
from app.schemas.user import UserCreate

class UserService:
    def __init__(self):
        self.user_repo = UserRepository()

    async def get_users(self) -> List[UserDB]:
        return await self.user_repo.get_all()

    async def create_user(self, user_data: UserCreate) -> UserDB:
        user = UserDB(name=user_data.name, email=user_data.email)
        return await self.user_repo.create(user)
