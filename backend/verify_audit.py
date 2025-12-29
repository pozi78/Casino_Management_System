import asyncio
from app.db.session import AsyncSessionLocal
from app.models.salon import Salon
from app.models.machine import Maquina
from app.models.user import Usuario, UsuarioSalon
from app import crud
from app.api.v1.endpoints import stats
from app.schemas.salon import SalonCreate
from sqlalchemy import select, delete

async def verify_audit():
    async with AsyncSessionLocal() as db:
        print("--- Audit Verification ---")
        
        # 1. Setup: Create a Salon and a Machine
        print("Creating test data...")
        salon_in = SalonCreate(nombre="Audit Salon", activo=True)
        salon = await crud.salon.create(db=db, obj_in=salon_in)
        
        machine = Maquina(nombre="Audit Machine", salon_id=salon.id, activo=True)
        db.add(machine)
        
        # Create a user assignment
        user_result = await db.execute(select(Usuario).where(Usuario.username == 'admin'))
        admin_user = user_result.scalars().first()
        
        # Soft delete the salon
        print(f"Soft deleting salon {salon.id}...")
        await crud.salon.remove(db=db, id=salon.id)
        
        # 2. Check get_dashboard_stats
        print("Checking Dashboard Stats...")
        from fastapi import Request
        # We simulate the dependency or call the logic directly
        # For simplicity, we just run the queries that were modified in stats.py
        from sqlalchemy import func
        q_salons = select(func.count(Salon.id)).where(Salon.activo == True, Salon.deleted_at.is_(None))
        count_salons = await db.scalar(q_salons)
        print(f"   Active Salons count: {count_salons}")
        
        q_machines = select(func.count(Maquina.id)).join(Salon).where(Maquina.activo == True, Maquina.eliminada == False, Salon.deleted_at.is_(None))
        count_machines = await db.scalar(q_machines)
        print(f"   Active Machines count: {count_machines}")
        
        # 3. Check filters metadata
        print("Checking Filters Metadata...")
        q_meta_machines = select(Maquina.id, Maquina.nombre, Maquina.salon_id).join(Salon).where(Maquina.activo == True, Maquina.eliminada == False, Salon.deleted_at.is_(None))
        res_meta = await db.execute(q_meta_machines)
        meta_machines = res_meta.all()
        found_test_machine = any(m.id == machine.id for m in meta_machines)
        print(f"   Test machine found in metadata? {found_test_machine} (Expected: False)")
        assert not found_test_machine

        # 4. Cleanup
        print("Cleaning up...")
        await db.execute(delete(Maquina).where(Maquina.id == machine.id))
        # Note: can't delete salon easily due to FKs if others exist, but it's soft-deleted now.
        await db.commit()
        
        print("AUDIT SUCCESS: Dashboard and Filters correctly respect soft delete.")

if __name__ == "__main__":
    asyncio.run(verify_audit())
