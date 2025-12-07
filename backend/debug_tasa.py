
import asyncio
import sys
import os

# Add current dir to sys.path to allow imports
sys.path.append(os.getcwd())

from app.db.session import AsyncSessionLocal
from app.models.machine import Maquina
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload

async def main():
    try:
        async with AsyncSessionLocal() as db:
            print("Connected to DB.")
            # Fetch active machines with types
            result = await db.execute(
                select(Maquina)
                .options(joinedload(Maquina.tipo_maquina))
                .where(Maquina.activo == True)
            )
            machines = result.scalars().all()
            
            print(f"Found {len(machines)} active machines.")
            print("-" * 50)
            
            for m in machines:
                print(f"ID: {m.id} | Name: {m.nombre}")
                
                # Type Info
                if m.tipo_maquina:
                    print(f"  Type: {m.tipo_maquina.nombre}")
                    print(f"  Type Base Rate: {m.tipo_maquina.tasa_semanal_orientativa}")
                    print(f"  Tasa Por Puesto: {m.tipo_maquina.tasa_por_puesto}")
                else:
                    print("  Type: None")
                
                # Machine Info
                print(f"  Machine Override: {m.tasa_semanal_override}")
                print(f"  Puestos: {m.numero_puesto}")
                
                # Logic Test
                weekly_rate = 0
                if m.tasa_semanal_override is not None and m.tasa_semanal_override > 0:
                    weekly_rate = m.tasa_semanal_override
                elif m.tipo_maquina and m.tipo_maquina.tasa_semanal_orientativa:
                    weekly_rate = m.tipo_maquina.tasa_semanal_orientativa
                    if m.tipo_maquina.tasa_por_puesto and m.numero_puesto and m.numero_puesto > 1:
                        weekly_rate = weekly_rate * m.numero_puesto
                
                print(f"  -> CALCULATED WEEKLY RATE: {weekly_rate}")
                print("-" * 20)
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
