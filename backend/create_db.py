import asyncio
import os
import asyncpg
from app.core.config import settings

async def create_database():
    # Connect to 'postgres' database to create the target database
    user = settings.POSTGRES_USER
    password = settings.POSTGRES_PASSWORD
    server = settings.POSTGRES_SERVER
    port = settings.POSTGRES_PORT
    target_db = settings.POSTGRES_DB
    
    print(f"Connecting to {server}:{port} as {user} to create {target_db}...")

    try:
        conn = await asyncpg.connect(
            user=user,
            password=password,
            host=server,
            port=port,
            database='postgres'
        )
        
        # Check if database exists
        exists = await conn.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = $1", target_db
        )
        
        if not exists:
            print(f"Creating database {target_db}...")
            await conn.execute(f'CREATE DATABASE "{target_db}"')
            print(f"Database {target_db} created successfully.")
        else:
            print(f"Database {target_db} already exists.")
            
        await conn.close()
        
    except Exception as e:
        print(f"Error creating database: {e}")

if __name__ == "__main__":
    # Ensure env vars are loaded from .env if running directly
    # config.py does this via pydantic-settings
    asyncio.run(create_database())
