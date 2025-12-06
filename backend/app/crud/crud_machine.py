from typing import List, Optional
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.machine import Maquina, TipoMaquina
from app.schemas.machine import MaquinaCreate, MaquinaUpdate, TipoMaquinaCreate, TipoMaquinaUpdate

class CRUDTipoMaquina:
    async def get(self, db: AsyncSession, id: int) -> Optional[TipoMaquina]:
        result = await db.execute(select(TipoMaquina).where(TipoMaquina.id == id))
        return result.scalars().first()

    async def get_multi(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> List[TipoMaquina]:
        result = await db.execute(select(TipoMaquina).offset(skip).limit(limit))
        return result.scalars().all()

    async def create(self, db: AsyncSession, *, obj_in: TipoMaquinaCreate) -> TipoMaquina:
        db_obj = TipoMaquina(
            nombre=obj_in.nombre,
            codigo=obj_in.codigo,
            tasa_semanal_base=obj_in.tasa_semanal_base,
            tasa_por_puesto=obj_in.tasa_por_puesto,
            descripcion=obj_in.descripcion,
            activo=obj_in.activo,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self,
        db: AsyncSession,
        *,
        db_obj: TipoMaquina,
        obj_in: TipoMaquinaUpdate | dict
    ) -> TipoMaquina:
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

    async def remove(self, db: AsyncSession, *, id: int) -> Optional[TipoMaquina]:
        result = await db.execute(select(TipoMaquina).where(TipoMaquina.id == id))
        obj = result.scalars().first()
        if obj:
            await db.delete(obj)
            await db.commit()
        return obj

class CRUDMaquina:
    async def get(self, db: AsyncSession, id: int) -> Optional[Maquina]:
        result = await db.execute(select(Maquina).where(Maquina.id == id))
        return result.scalars().first()

    async def get_multi(
        self, db: AsyncSession, skip: int = 0, limit: int = 100, salon_id: Optional[int] = None
    ) -> List[Maquina]:
        query = select(Maquina)
        if salon_id:
            query = query.where(Maquina.salon_id == salon_id)
        
        result = await db.execute(query.offset(skip).limit(limit))
        return result.scalars().all()

    async def create(self, db: AsyncSession, *, obj_in: MaquinaCreate) -> Maquina:
        db_obj = Maquina(
            salon_id=obj_in.salon_id,
            tipo_maquina_id=obj_in.tipo_maquina_id,
            codigo_interno=obj_in.codigo_interno,
            numero_serie=obj_in.numero_serie,
            maquina_padre_id=obj_in.maquina_padre_id,
            numero_puesto=obj_in.numero_puesto,
            tasa_semanal_override=obj_in.tasa_semanal_override,
            activo=obj_in.activo,
            fecha_alta=obj_in.fecha_alta,
            fecha_baja=obj_in.fecha_baja,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self,
        db: AsyncSession,
        *,
        db_obj: Maquina,
        obj_in: MaquinaUpdate | dict
    ) -> Maquina:
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

    async def remove(self, db: AsyncSession, *, id: int) -> Optional[Maquina]:
        result = await db.execute(select(Maquina).where(Maquina.id == id))
        obj = result.scalars().first()
        if obj:
            await db.delete(obj)
            await db.commit()
        return obj

tipo_maquina = CRUDTipoMaquina()
maquina = CRUDMaquina()
