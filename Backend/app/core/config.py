from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Lead Management CRM MVP"
    API_V1_STR: str = "/api/v1"
    
    MONGO_URI: str = "mongodb://localhost:27017"
    DB_NAME: str = "crm_db"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
