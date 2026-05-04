from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

class MongoDB:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None

db = MongoDB()

async def connect_to_mongo():
    db.client = AsyncIOMotorClient(settings.MONGO_URI)
    db.db = db.client[settings.DB_NAME]
    
    # Create indexes
    await db.db.leads.create_index("status")
    await db.db.leads.create_index("assigned_to")
    await db.db.leads.create_index("visit_date")

async def close_mongo_connection():
    if db.client is not None:
        db.client.close()
