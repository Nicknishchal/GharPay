import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.models.user import UserDB
from app.models.lead import LeadDB, LeadStatus
from datetime import datetime, timedelta, timezone

async def seed():
    print(f"Connecting to MongoDB at {settings.MONGO_URI}...")
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.DB_NAME]

    # Create users
    print("Creating sample users...")
    user1 = UserDB(name="Alice Agent", email="alice@example.com")
    user2 = UserDB(name="Bob Broker", email="bob@example.com")

    res1 = await db.users.insert_one(user1.model_dump(by_alias=True))
    res2 = await db.users.insert_one(user2.model_dump(by_alias=True))
    
    user1.id = res1.inserted_id
    user2.id = res2.inserted_id
    print(f"Users created with IDs: {user1.id}, {user2.id}")

    # Create leads
    print("Creating sample leads...")
    now = datetime.now(timezone.utc)
    leads = [
        LeadDB(
            name="John Doe",
            phone="1234567890",
            budget=150000.0,
            location="Downtown",
            status=LeadStatus.NEW,
            created_at=now,
            updated_at=now
        ),
        LeadDB(
            name="Jane Smith",
            phone="0987654321",
            budget=200000.0,
            location="Suburbs",
            status=LeadStatus.CONTACTED,
            assigned_to=user1.id,
            created_at=now,
            updated_at=now
        ),
        LeadDB(
            name="Mike Johnson",
            phone="5551234567",
            budget=300000.0,
            location="Uptown",
            status=LeadStatus.VISIT_SCHEDULED,
            assigned_to=user2.id,
            visit_date=now + timedelta(days=3),
            created_at=now,
            updated_at=now
        )
    ]
    
    for lead in leads:
        await db.leads.insert_one(lead.model_dump(by_alias=True))

    print("Seed completed successfully!")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed())
