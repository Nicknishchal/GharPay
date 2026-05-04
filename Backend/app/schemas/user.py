from pydantic import BaseModel, Field
from app.utils.pydantic_objectid import PyObjectId

class UserCreate(BaseModel):
    name: str
    email: str

class UserResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    name: str
    email: str

    class Config:
        populate_by_name = True
        json_encoders = {PyObjectId: str}
