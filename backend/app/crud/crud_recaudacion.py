from typing import List, Optional
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload, selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.recaudacion import Recaudacion, RecaudacionMaquina
from app.models.machine import Maquina, Puesto
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
                .options(
                    joinedload(RecaudacionMaquina.maquina)
                    .options(
                        joinedload(Maquina.tipo_maquina),
                        selectinload(Maquina.puestos)
                    ),
                    joinedload(RecaudacionMaquina.puesto)
                ),
                joinedload(Recaudacion.salon)
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
        query = query.order_by(Recaudacion.fecha_fin.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.unique().scalars().all()

    async def create_with_initial_details(
        self, db: AsyncSession, *, obj_in: RecaudacionCreate
    ) -> Recaudacion:
        # Check for Overlap
        stmt = select(Recaudacion).where(
            Recaudacion.salon_id == obj_in.salon_id
        )
        existing_list = (await db.execute(stmt)).scalars().all()
        
        for existing in existing_list:
            # Overlap Logic: (Start1 < End2) AND (End1 > Start2)
            # Continuity Exception: If NewStart == OldEnd, it's allowed.
            if (obj_in.fecha_inicio < existing.fecha_fin) and (obj_in.fecha_fin > existing.fecha_inicio):
                 raise ValueError(f"Solapamiento detectado. Intentando crear: {obj_in.fecha_inicio} - {obj_in.fecha_fin}. Conflictúa con Recaudación ID {existing.id} (Salon {existing.salon_id}): {existing.fecha_inicio} - {existing.fecha_fin}")

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
        days_diff = (obj_in.fecha_fin - obj_in.fecha_inicio).days
        if days_diff < 0:
            days_diff = 0

        # 2. Fetch Active Puestos with Machine info joined
        stmt = select(Puesto).join(Maquina).where(
            Maquina.salon_id == obj_in.salon_id,
            Puesto.activo == True,
            Puesto.eliminado == False, 
            Maquina.eliminada == False 
        ).options(joinedload(Puesto.maquina).joinedload(Maquina.tipo_maquina))
        
        result = await db.execute(stmt)
        puestos = result.scalars().all()

        # 3. Create Details
        for puesto in puestos:
            # Tasa Logic
            tasa_base = 0
            detalle_tasa = "Sin Tasa"
            
            # Determine Weekly Rate from Puesto
            weekly_rate = puesto.tasa_semanal or 0
            
            # Fallback legacy logic if 0? 
            if weekly_rate == 0:
                 if puesto.maquina.tasa_semanal_override:
                     weekly_rate = puesto.maquina.tasa_semanal_override
                 elif puesto.maquina.tipo_maquina and puesto.maquina.tipo_maquina.tasa_semanal_orientativa:
                     weekly_rate = puesto.maquina.tipo_maquina.tasa_semanal_orientativa

            if weekly_rate > 0:
                 detalle_tasa = "Tasa Calculada"

            # Calculate Pro-rated
            if weekly_rate > 0 and days_diff > 0:
                daily_rate = float(weekly_rate) / 7.0
                tasa_base = daily_rate * days_diff
            
            detail = RecaudacionMaquina(
                recaudacion_id=db_obj.id,
                maquina_id=puesto.maquina_id,
                puesto_id=puesto.id,
                tasa_calculada=tasa_base,
                tasa_final=tasa_base, 
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
