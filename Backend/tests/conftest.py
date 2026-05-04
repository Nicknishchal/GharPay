import pytest
import asyncio
from typing import AsyncGenerator
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorClient

from app.main import app
from app.core.config import settings
from app.db.mongodb import db

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session", autouse=True)
async def test_db():
    settings.DB_NAME = "test_crm_db"
    # Wait until DB connection is initialized by lifespan if possible,
    # or just initialize it manually for tests.
    db.client = AsyncIOMotorClient(settings.MONGO_URI)
    db.db = db.client[settings.DB_NAME]
    
    yield db.db
    
    await db.client.drop_database(settings.DB_NAME)
    db.client.close()

@pytest.fixture(scope="module")
async def client() -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(app=app, base_url="http://test") as c:
        yield c
