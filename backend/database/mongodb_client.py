"""
MongoDB Client - Async Database Connection Management
Uses Motor for async MongoDB operations
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from functools import lru_cache
from typing import Optional
import logging

from ..config import settings

logger = logging.getLogger(__name__)

# Global client instance
_client: Optional[AsyncIOMotorClient] = None
_database: Optional[AsyncIOMotorDatabase] = None


async def connect_to_mongodb() -> None:
    """Initialize MongoDB connection"""
    global _client, _database
    
    try:
        logger.info("Connecting to MongoDB...")
        _client = AsyncIOMotorClient(
            settings.mongodb_uri,
            serverSelectionTimeoutMS=5000,
            maxPoolSize=10,
            minPoolSize=1
        )
        
        # Verify connection
        await _client.admin.command('ping')
        _database = _client[settings.mongodb_database]
        
        logger.info(f"Connected to MongoDB database: {settings.mongodb_database}")
        
        # Create indexes
        await create_indexes()
        
    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise


async def close_mongodb_connection() -> None:
    """Close MongoDB connection"""
    global _client, _database
    
    if _client:
        _client.close()
        _client = None
        _database = None
        logger.info("MongoDB connection closed")


async def create_indexes() -> None:
    """Create necessary database indexes"""
    if _database is None:
        return
        
    try:
        # Users collection indexes
        users = _database.users
        await users.create_index("user_id", unique=True)
        await users.create_index("created_at")
        
        # Conversation sessions indexes
        sessions = _database.conversation_sessions
        await sessions.create_index("user_id")
        await sessions.create_index("session_id", unique=True)
        await sessions.create_index("last_active")
        
        logger.info("Database indexes created successfully")
        
    except Exception as e:
        logger.warning(f"Error creating indexes: {e}")


def get_client() -> AsyncIOMotorClient:
    """Get the MongoDB client instance"""
    if _client is None:
        raise RuntimeError("MongoDB client not initialized. Call connect_to_mongodb() first.")
    return _client


def get_database() -> AsyncIOMotorDatabase:
    """Get the MongoDB database instance"""
    if _database is None:
        raise RuntimeError("MongoDB database not initialized. Call connect_to_mongodb() first.")
    return _database


# Convenience function for getting collections
def get_collection(name: str):
    """Get a specific collection from the database"""
    db = get_database()
    return db[name]
