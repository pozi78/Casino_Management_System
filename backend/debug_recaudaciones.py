import asyncio
import os
import sys
from sqlalchemy import select
from datetime import datetime

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import engine
from app.models.recaudacion import Recaudacion

async def debug_recaudaciones():
    print("Checking existing Recaudaciones in DB...")
    async with engine.begin() as conn:
        result = await conn.execute(select(Recaudacion))
        recs = result.scalars().all()
        
        if not recs:
            print("No Recaudaciones found in DB.")
        else:
            print(f"Found {len(recs)} Recaudaciones:")
            for r in recs:
                print(f"ID: {r.id}, Salon: {r.salon_id}, Label: {r.etiqueta}")
                print(f"  Start: {r.fecha_inicio} (Type: {type(r.fecha_inicio)})")
                print(f"  End:   {r.fecha_fin} (Type: {type(r.fecha_fin)})")
                print("-" * 20)

if __name__ == "__main__":
    asyncio.run(debug_recaudaciones())
