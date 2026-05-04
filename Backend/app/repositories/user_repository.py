from typing import Optional, List
from bson import ObjectId
from app.db.mongodb import db
from app.models.user import UserDB

class UserRepository:
    @property
    def collection(self):
        return db.db.users

    async def create(self, user: UserDB) -> UserDB:
        result = await self.collection.insert_one(user.model_dump(by_alias=True))
        user.id = result.inserted_id
        return user

    async def get_by_id(self, user_id: str) -> Optional[UserDB]:
        ids = [user_id]
        if ObjectId.is_valid(user_id):
            ids.append(ObjectId(user_id))
        
        doc = await self.collection.find_one({"_id": {"$in": ids}})
        if doc:
            return UserDB(**doc)
        return None

    async def get_all(self) -> List[UserDB]:
        cursor = self.collection.find()
        users = []
        async for doc in cursor:
            users.append(UserDB(**doc))
        return users
