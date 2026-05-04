from pydantic import BaseModel, Field
from app.utils.pydantic_objectid import PyObjectId

class UserDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    name: str
    email: str
    
    class Config:
        populate_by_name = True
        json_encoders = {PyObjectId: str}
