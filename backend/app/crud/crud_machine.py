from typing import List, Optional
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.machine import Maquina, TipoMaquina, GrupoMaquina
from app.schemas.machine import (
    MaquinaCreate, MaquinaUpdate, 
    TipoMaquinaCreate, TipoMaquinaUpdate,
    GrupoMaquinaCreate, GrupoMaquinaUpdate
)

class CRUDGrupoMaquina:
    async def get(self, db: AsyncSession, id: int) -> Optional[GrupoMaquina]:
        result = await db.execute(select(GrupoMaquina).where(GrupoMaquina.id == id))
        return result.scalars().first()

    async def get_multi(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> List[GrupoMaquina]:
        result = await db.execute(select(GrupoMaquina).offset(skip).limit(limit))
        return result.scalars().all()

    async def create(self, db: AsyncSession, *, obj_in: GrupoMaquinaCreate) -> GrupoMaquina:
        db_obj = GrupoMaquina(
            nombre=obj_in.nombre,
            descripcion=obj_in.descripcion,
            cantidad_puestos=obj_in.cantidad_puestos,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self,
        db: AsyncSession,
        *,
        db_obj: GrupoMaquina,
        obj_in: GrupoMaquinaUpdate | dict
    ) -> GrupoMaquina:
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

    async def remove(self, db: AsyncSession, *, id: int) -> Optional[GrupoMaquina]:
        result = await db.execute(select(GrupoMaquina).where(GrupoMaquina.id == id))
        obj = result.scalars().first()
        if obj:
            await db.delete(obj)
            await db.commit()
        return obj

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
        # Pydantic model might map tasa_semanal_orientativa to tasa_semanal_base if alias was used, 
        # but here we use the model field names directly.
        # Assuming schemas match the model fields now.
        
        db_obj = TipoMaquina(
            nombre=obj_in.nombre,
            tasa_semanal_orientativa=obj_in.tasa_semanal_orientativa, # Updated field
            es_multipuesto=obj_in.es_multipuesto, # New field
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
            grupo_id=obj_in.grupo_id, # New field
            nombre=obj_in.nombre, # New field
            nombre_referencia_uorsa=obj_in.nombre_referencia_uorsa, # New field
            numero_serie=obj_in.numero_serie,
            maquina_padre_id=obj_in.maquina_padre_id,
            numero_puesto=obj_in.numero_puesto,
            es_multipuesto=obj_in.es_multipuesto, # New field
            tasa_semanal_override=obj_in.tasa_semanal_override,
            observaciones=obj_in.observaciones, # New field
            activo=obj_in.activo,
            fecha_alta=obj_in.fecha_alta,
            fecha_baja=obj_in.fecha_baja,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)

        # Handle Multipuesto Auto-Creation (Parent Container + Children)
        # If marked as Multipuesto, generate child machines for revenue tracking
        if obj_in.es_multipuesto and obj_in.numero_puesto and obj_in.numero_puesto > 0:
            for i in range(1, obj_in.numero_puesto + 1):
                child_name = f"{db_obj.nombre} {i}"
                child = Maquina(
                    salon_id=db_obj.salon_id,
                    tipo_maquina_id=db_obj.tipo_maquina_id,
                    grupo_id=db_obj.grupo_id,
                    nombre=child_name,
                    maquina_padre_id=db_obj.id,
                    numero_puesto=i, # Seat Index
                    es_multipuesto=False, # Child is single unit
                    activo=True,
                    fecha_alta=db_obj.fecha_alta,
                    nombre_referencia_uorsa=f"{db_obj.nombre_referencia_uorsa or ''} {i}".strip(),
                    numero_serie=f"{db_obj.numero_serie or ''}-{i}" if db_obj.numero_serie else None
                )
                db.add(child)
            
            await db.commit()

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
grupo_maquina = CRUDGrupoMaquina()
