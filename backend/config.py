"""
Configuration Management for Movie & Series Companion Agent
Uses Pydantic Settings for env var management
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # MongoDB Configuration
    mongodb_uri: str = Field(
        default="mongodb://localhost:27017",
        alias="MONGODB_URI",
        description="MongoDB connection string"
    )
    mongodb_database: str = Field(
        default="moviecompanion",
        alias="MONGODB_DATABASE",
        description="MongoDB database name"
    )
    
    # OpenAI / LLM Configuration
    openai_api_key: str = Field(
        default="",
        alias="OPENAI_API_KEY",
        description="OpenAI API key for LiteLLM"
    )
    llm_model: str = Field(
        default="openai/gpt-4o-mini",
        alias="LLM_MODEL",
        description="LLM model identifier for LiteLLM"
    )
    
    # TMDB API Configuration
    tmdb_api_key: str = Field(
        default="",
        alias="TMDB_API_KEY",
        description="TMDB API key for movie/TV data"
    )
    tmdb_base_url: str = Field(
        default="https://api.themoviedb.org/3",
        alias="TMDB_BASE_URL",
        description="TMDB API base URL"
    )
    
    # OMDB API Configuration (Fallback)
    omdb_api_key: str = Field(
        default="",
        alias="OMDB_API_KEY",
        description="OMDB API key (fallback)"
    )
    omdb_base_url: str = Field(
        default="http://www.omdbapi.com",
        alias="OMDB_BASE_URL",
        description="OMDB API base URL"
    )
    
    # Application Settings
    app_host: str = Field(
        default="0.0.0.0",
        alias="APP_HOST",
        description="Application host"
    )
    app_port: int = Field(
        default=8080,
        alias="APP_PORT",
        description="Application port"
    )
    app_env: str = Field(
        default="development",
        alias="APP_ENV",
        description="Application environment"
    )
    log_level: str = Field(
        default="INFO",
        alias="LOG_LEVEL",
        description="Logging level"
    )
    
    # Session Configuration
    session_secret_key: str = Field(
        default="change-this-secret-key-in-production",
        alias="SESSION_SECRET_KEY",
        description="Secret key for session management"
    )
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Get cached application settings"""
    return Settings()


# Quick access to settings
settings = get_settings()
