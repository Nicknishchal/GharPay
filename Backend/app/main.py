from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.exceptions import APIException, api_exception_handler, global_exception_handler
from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.api.v1.endpoints import leads, dashboard, users
import contextlib

@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(APIException, api_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

app.include_router(leads.router, prefix=f"{settings.API_V1_STR}/leads", tags=["leads"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["dashboard"])
