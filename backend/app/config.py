from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

    PROJECT_NAME: str = "Inventory & Order Management API"
    DATABASE_URL: str = "postgresql://postgres:postgres@db:5432/inventory_db"
    CORS_ORIGINS: List[str] = ["*"]

settings = Settings()
