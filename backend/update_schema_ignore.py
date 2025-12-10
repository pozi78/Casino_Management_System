import asyncio
import os
import sys
from sqlalchemy import text  # Import text explicitly

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import engine
from app.db.base import Base
from app.models.machine import MaquinaExcelMap # Import to ensure it is in Base.metadata

async def update_schema():
    print("Updating schema for MaquinaExcelMap...")
    async with engine.begin() as conn:
        print("Dropping table maquina_excel_map...")
        await conn.execute(text("DROP TABLE IF EXISTS maquina_excel_map CASCADE;"))
        
    async with engine.begin() as conn:
        print("Recreating tables...")
        # create_all usually requires a sync engine or run_sync
        await conn.run_sync(Base.metadata.create_all)
        print("Schema updated successfully.")

if __name__ == "__main__":
    asyncio.run(update_schema())
