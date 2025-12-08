import asyncio
import os
import sys
from sqlalchemy import text

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import engine

async def reset_recaudaciones():
    print("Resetting all Recaudacion tables...")
    async with engine.begin() as conn:
        # Use TRUNCATE CASCADE to clean everything, restarting identity (IDs back to 1)
        # Order matters less with CASCADE but let's list them.
        tables = [
            'recaudacion_concepto_extra',
            'recaudacion_maquina',
            'recaudacion'
        ]
        
        # Check if tables exist before truncating? No, we assume schema exists.
        # Postgres syntax: TRUNCATE TABLE name1, name2 RESTART IDENTITY CASCADE;
        
        print("Executing TRUNCATE...")
        try:
            await conn.execute(text("TRUNCATE TABLE recaudacion_concepto_extra, recaudacion_maquina, recaudacion RESTART IDENTITY CASCADE;"))
            print("Truncate successful.")
        except Exception as e:
            print(f"Error during truncate: {e}")
            print("Attempting DELETE instead...")
            await conn.execute(text("DELETE FROM recaudacion_concepto_extra;"))
            await conn.execute(text("DELETE FROM recaudacion_maquina;"))
            await conn.execute(text("DELETE FROM recaudacion;"))
            print("Delete successful.")

if __name__ == "__main__":
    asyncio.run(reset_recaudaciones())
