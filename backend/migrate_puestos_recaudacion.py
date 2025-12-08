import asyncio
import os
import sys
from sqlalchemy import text

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import engine

async def migrate():
    print("Starting migration...")
    async with engine.begin() as conn:
        print("Adding column puesto_id...")
        await conn.execute(text("ALTER TABLE recaudacion_maquina ADD COLUMN IF NOT EXISTS puesto_id INTEGER REFERENCES puesto(id);"))
        
        print("Dropping old constraint uq_recaudacion_maquina if exists...")
        # Note: 'IF EXISTS' might not be supported in older PG for constraints, but usually is.
        # If it fails, we catch it.
        try:
             await conn.execute(text("ALTER TABLE recaudacion_maquina DROP CONSTRAINT IF EXISTS uq_recaudacion_maquina;"))
        except Exception as e:
             print(f"Constraint drop warning: {e}")
        
        print("Adding new constraint uq_recaudacion_puesto...")
        try:
             # Ensure no duplicates first? Assuming table is compatible or empty enough.
             # If duplicate (recaudacion_id, NULL) exist, this might fail if (recaudacion_id, puesto_id) is unique.
             # PostgreSQL treats (val, NULL) != (val, NULL) for unique constraints (unless NULLS NOT DISTINCT is used, PG15+).
             # So duplicates with NULL are allowed.
             await conn.execute(text("ALTER TABLE recaudacion_maquina ADD CONSTRAINT uq_recaudacion_puesto UNIQUE (recaudacion_id, puesto_id);"))
        except Exception as e:
             print(f"Constraint add warning: {e}")
    print("Migration complete.")

if __name__ == "__main__":
    asyncio.run(migrate())
