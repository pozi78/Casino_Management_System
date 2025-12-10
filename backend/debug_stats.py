
import asyncio
import sys
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.db.session import AsyncSessionLocal
from app.models.recaudacion import Recaudacion, RecaudacionMaquina
from app.models.salon import Salon
from app.models.user import Usuario
from app.models.machine import Maquina

async def main():
    async with AsyncSessionLocal() as db:
        print("--- DEBUGGING STATS ---")
        
        # 0. Check Basic Counts (Entities)
        c_salons = await db.scalar(select(func.count(Salon.id)).where(Salon.activo == True))
        print(f"Active Salons: {c_salons}")
        
        c_machines = await db.scalar(select(func.count(Maquina.id)).where(Maquina.activo == True))
        print(f"Active Machines: {c_machines}")
        
        c_users = await db.scalar(select(func.count(Usuario.id)).where(Usuario.activo == True))
        print(f"Active Users: {c_users}")
        
        # 1. Check Available Years in Recaudacion
        q_years = select(Recaudacion.fecha_fin).where(Recaudacion.fecha_fin.isnot(None))
        result = await db.execute(q_years)
        dates = result.scalars().all()
        years = sorted(list(set(d.year for d in dates if d)))
        print(f"Available Years in DB: {years}")
        
        # 2. Check RecaudacionMaquina count
        q_count = select(func.count(RecaudacionMaquina.id))
        count = await db.scalar(q_count)
        print(f"Total RecaudacionMaquina rows: {count}")
        
        if not years:
            print("No years found. Exiting.")
            return

        target_year = years[-1] # Use last available year
        print(f"Targeting Year: {target_year}")

        # 3. Test Extract Year Query logic
        # This mimics the filter logic
        q_check = select(Recaudacion).where(func.extract('year', Recaudacion.fecha_fin) == target_year)
        count_year = await db.execute(select(func.count()).select_from(q_check.subquery()))
        print(f"Recaudacion rows for {target_year} (via extract): {count_year.scalar()}")

        # 4. Test Joined Query (Machine Logic)
        q_mach = select(RecaudacionMaquina).join(Recaudacion)
        q_mach = q_mach.where(func.extract('year', Recaudacion.fecha_fin) == target_year)
        
        result_mach = await db.execute(q_mach)
        rows_mach = result_mach.scalars().all()
        print(f"RecaudacionMaquina rows joined for {target_year}: {len(rows_mach)}")
        
        if len(rows_mach) == 0:
            print("WARNING: No machine details found for this year. This explains why 'All Machines' returns empty.")
            
            # Check if there are unlinked recaudaciones
            q_unlinked = select(Recaudacion).where(func.extract('year', Recaudacion.fecha_fin) == target_year)
            res_unlinked = await db.execute(q_unlinked)
            recs = res_unlinked.scalars().all()
            print(f"Total Recaudaciones for {target_year}: {len(recs)}")
            for r in recs:
                print(f"Recaudacion ID: {r.id}, Total Global: {r.total_global}")
            if len(recs) > 0:
                 print(f"Example Recaudacion ID {recs[0].id} has {len(await get_detalles(db, recs[0].id))} detalles.")

async def get_detalles(db, rec_id):
     # Helper to check relationship
     q = select(RecaudacionMaquina).where(RecaudacionMaquina.recaudacion_id == rec_id)
     res = await db.execute(q)
     return res.scalars().all()

if __name__ == "__main__":
    asyncio.run(main())
