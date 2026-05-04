import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def check_db():
    uri = "mongodb+srv://nishchal323_db_user:pHnSWw3AkSebvGU5@cluster0.dcdm5ox.mongodb.net/"
    client = AsyncIOMotorClient(uri)
    db = client.gharpay
    
    print("\n--- One Lead Sample ---")
    lead = await db.leads.find_one({"name": "Mike Johnson"})
    if lead:
        print(lead)
    else:
        print("Mike Johnson not found")

if __name__ == "__main__":
    asyncio.run(check_db())
