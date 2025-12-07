from typing import List, Optional
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.recaudacion import Recaudacion, RecaudacionMaquina
from app.models.machine import Maquina
from app.schemas.recaudacion import (
    RecaudacionCreate, RecaudacionUpdate,
    RecaudacionMaquinaCreate, RecaudacionMaquinaUpdate
)

class CRUDRecaudacion:
    async def get(self, db: AsyncSession, id: int) -> Optional[Recaudacion]:
        # Join details for full view
        result = await db.execute(
            select(Recaudacion)
            .options(
                joinedload(Recaudacion.detalles)
                .joinedload(RecaudacionMaquina.maquina)
                .joinedload(Maquina.tipo_maquina)
            )
            .where(Recaudacion.id == id)
        )
        return result.scalars().first()

    async def get_multi(
        self, db: AsyncSession, skip: int = 0, limit: int = 100, salon_id: Optional[int] = None
    ) -> List[Recaudacion]:
        query = select(Recaudacion).options(joinedload(Recaudacion.detalles))
        if salon_id:
            query = query.where(Recaudacion.salon_id == salon_id)
        # Order by start date descending usually
        query = query.order_by(Recaudacion.fecha_inicio.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.unique().scalars().all()

    async def create_with_initial_details(
        self, db: AsyncSession, *, obj_in: RecaudacionCreate
    ) -> Recaudacion:
        # 1. Create Recaudacion Header
        db_obj = Recaudacion(
            salon_id=obj_in.salon_id,
            fecha_inicio=obj_in.fecha_inicio,
            fecha_fin=obj_in.fecha_fin,
            fecha_cierre=obj_in.fecha_cierre,
            etiqueta=obj_in.etiqueta,
            origen=obj_in.origen,
            referencia_fichero=obj_in.referencia_fichero,
            notas=obj_in.notas,
        )
        db.add(db_obj)
        await db.flush() # Get ID

        # Calculate days for tax (fin - inicio)
        # Days Included - 1 is equivalent to simple difference (EndDate - StartDate)
        # e.g. 1st to 2nd = 2 inclusive days - 1 = 1 day tax.
        # (2nd - 1st).days = 1.
        days_diff = (obj_in.fecha_fin - obj_in.fecha_inicio).days
        if days_diff < 0:
            days_diff = 0

        # 2. Fetch Active Machines with Type loaded
        stmt = select(Maquina).options(joinedload(Maquina.tipo_maquina)).where(
            Maquina.salon_id == obj_in.salon_id,
            Maquina.activo == True
        )
        result = await db.execute(stmt)
        machines = result.scalars().all()

        # 3. Create Details
        for machine in machines:
            # Tasa Logic
            tasa_base = 0
            detalle_tasa = "Sin Tasa"
            
            # Determine Weekly Rate
            weekly_rate = 0
            
            if machine.tasa_semanal_override is not None and machine.tasa_semanal_override > 0:
                weekly_rate = machine.tasa_semanal_override
                detalle_tasa = "Override Maquina"
            elif machine.tipo_maquina and machine.tipo_maquina.tasa_semanal_orientativa:
                weekly_rate = machine.tipo_maquina.tasa_semanal_orientativa
                detalle_tasa = f"Base Tipo: {machine.tipo_maquina.nombre}"

                # Handle Multi-position Rate
                if machine.tipo_maquina.tasa_por_puesto and machine.numero_puesto and machine.numero_puesto > 1:
                    weekly_rate = weekly_rate * machine.numero_puesto
                    detalle_tasa += f" (x{machine.numero_puesto} puestos)"
            
            # Calculate Pro-rated
            # Rate = (Weekly / 7) * days
            if weekly_rate > 0 and days_diff > 0:
                daily_rate = float(weekly_rate) / 7.0
                tasa_base = daily_rate * days_diff
            
            detail = RecaudacionMaquina(
                recaudacion_id=db_obj.id,
                maquina_id=machine.id,
                tasa_calculada=tasa_base,
                tasa_final=tasa_base, # Default to calculated
                detalle_tasa=detalle_tasa,
                retirada_efectivo=0,
                cajon=0,
                pago_manual=0,
                tasa_ajuste=0
            )
            db.add(detail)
        
        await db.commit()
        await db.refresh(db_obj)
        # Re-fetch with details
        return await self.get(db, db_obj.id)

    async def update(
        self,
        db: AsyncSession,
        *,
        db_obj: Recaudacion,
        obj_in: RecaudacionUpdate | dict
    ) -> Recaudacion:
        obj_data = db_obj.__dict__
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
            
        for field in update_data:
            if field in obj_data:
                setattr(db_obj, field, update_data[field])
        
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def remove(self, db: AsyncSession, *, id: int) -> Optional[Recaudacion]:
        # We need to fetch it first to return it, and ensure it exists.
        # Since we have cascade delete on details, deleting the parent is enough.
        result = await db.execute(select(Recaudacion).where(Recaudacion.id == id))
        obj = result.scalars().first()
        if obj:
            await db.delete(obj)
            await db.commit()
        return obj

class CRUDRecaudacionMaquina:
    async def get(self, db: AsyncSession, id: int) -> Optional[RecaudacionMaquina]:
        result = await db.execute(select(RecaudacionMaquina).where(RecaudacionMaquina.id == id))
        return result.scalars().first()

    async def update(
        self,
        db: AsyncSession,
        *,
        db_obj: RecaudacionMaquina,
        obj_in: RecaudacionMaquinaUpdate | dict
    ) -> RecaudacionMaquina:
        obj_data = db_obj.__dict__
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
            
        for field in update_data:
            if field in obj_data:
                setattr(db_obj, field, update_data[field])

        # Recalculate tasa_final if adjustment changes
        if 'tasa_ajuste' in update_data:
             db_obj.tasa_final = db_obj.tasa_calculada + db_obj.tasa_ajuste

        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        
        # Load relationships for schema
        result = await db.execute(
            select(RecaudacionMaquina)
            .options(joinedload(RecaudacionMaquina.maquina))
            .where(RecaudacionMaquina.id == db_obj.id)
        )
        return result.scalars().first()

recaudacion = CRUDRecaudacion()
recaudacion_maquina = CRUDRecaudacionMaquina()
