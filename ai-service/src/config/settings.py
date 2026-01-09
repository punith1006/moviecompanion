from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional
from pathlib import Path
from dotenv import load_dotenv
import os

# Load .env file from the ai-service directory
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(env_path)


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # API Configuration
    app_name: str = "CinePal AI Service"
    debug: bool = True
    host: str = "0.0.0.0"
    port: int = 5000
    
    # OpenAI Configuration
    openai_api_key: Optional[str] = os.getenv("OPENAI_API_KEY")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    # TMDb Configuration
    tmdb_api_key: Optional[str] = os.getenv("TMDB_API_KEY")
    tmdb_base_url: str = "https://api.themoviedb.org/3"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

# Debug: Print settings status on load
print(f"🔧 Loaded .env from: {env_path}")
print(f"🔧 OpenAI API Key configured: {bool(settings.openai_api_key)}")
print(f"🔧 TMDb API Key configured: {bool(settings.tmdb_api_key)}")
print(f"🔧 OpenAI Model: {settings.openai_model}")
