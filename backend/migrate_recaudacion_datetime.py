import asyncio
import os
import sys
from sqlalchemy import text

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import engine

async def migrate():
    print("Starting migration (Date -> DateTime)...")
    async with engine.begin() as conn:
        print("Altering columns fecha_inicio, fecha_fin to TIMESTAMP...")
        
        # PostgreSQL syntax to alter column type
        # We need to assume existing data is 00:00:00.
        try:
            await conn.execute(text("ALTER TABLE recaudacion ALTER COLUMN fecha_inicio TYPE TIMESTAMP USING fecha_inicio::timestamp;"))
            await conn.execute(text("ALTER TABLE recaudacion ALTER COLUMN fecha_fin TYPE TIMESTAMP USING fecha_fin::timestamp;"))
            # fecha_cierre remains Date
            print("Migration successful.")
        except Exception as e:
            print(f"Error during migration: {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
