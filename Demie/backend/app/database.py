from neo4j import AsyncGraphDatabase
import os

# Database Driver - Global Singleton
driver = AsyncGraphDatabase.driver(
    "bolt://localhost:7687", 
    auth=("neo4j", "password123")
)

async def get_db_session():
    session = driver.session()
    try:
        yield session
    finally:
        await session.close()