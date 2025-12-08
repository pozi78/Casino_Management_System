from typing import List, Optional, Union, Dict, Any
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.machine import Maquina, Puesto, TipoMaquina, GrupoMaquina
from app.schemas.machine import (
    MaquinaCreate, MaquinaUpdate,
    TipoMaquinaCreate, TipoMaquinaUpdate,
    GrupoMaquinaCreate, GrupoMaquinaUpdate,
    PuestoCreate, PuestoUpdate
)

# ... (Previous CRUDs omitted for brevity in search block if not modifying them, but I must match exact target content)
# Since I can't skip lines in TargetContent easily without looking fragile.
# I will use multi_replace.

# No, I will use replace_file_content for imports first, then another for methods.

# Changing imports first.

class CRUDGrupoMaquina:
    async def get(self, db: AsyncSession, id: int) -> Optional[GrupoMaquina]:
        result = await db.execute(select(GrupoMaquina).where(GrupoMaquina.id == id))
        return result.scalars().first()

    async def get_multi(self, db: AsyncSession, skip: int = 0, limit: int = 100) -> List[GrupoMaquina]:
        result = await db.execute(select(GrupoMaquina).offset(skip).limit(limit))
        return result.scalars().all()

    async def create(self, db: AsyncSession, *, obj_in: GrupoMaquinaCreate) -> GrupoMaquina:
        db_obj = GrupoMaquina(
            nombre=obj_in.nombre,
            cantidad_puestos=obj_in.cantidad_puestos,
            descripcion=obj_in.descripcion
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(self, db: AsyncSession, *, db_obj: GrupoMaquina, obj_in: Union[GrupoMaquinaUpdate, Dict[str, Any]]) -> GrupoMaquina:
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

    async def get_multi(self, db: AsyncSession, skip: int = 0, limit: int = 100) -> List[TipoMaquina]:
        result = await db.execute(select(TipoMaquina).offset(skip).limit(limit))
        return result.scalars().all()

    async def create(self, db: AsyncSession, *, obj_in: TipoMaquinaCreate) -> TipoMaquina:
        db_obj = TipoMaquina(
            nombre=obj_in.nombre,
            tasa_semanal_orientativa=obj_in.tasa_semanal_orientativa,
            tasa_por_puesto=obj_in.tasa_por_puesto,
            es_multipuesto=obj_in.es_multipuesto,
            descripcion=obj_in.descripcion,
            activo=obj_in.activo
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(self, db: AsyncSession, *, db_obj: TipoMaquina, obj_in: Union[TipoMaquinaUpdate, Dict[str, Any]]) -> TipoMaquina:
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
        # Filter by eliminada=False usually
        result = await db.execute(
            select(Maquina)
            .options(selectinload(Maquina.puestos))
            .where(Maquina.id == id, Maquina.eliminada == False)
        )
        return result.scalars().first()

    async def get_multi(
        self, db: AsyncSession, skip: int = 0, limit: int = 100, salon_id: Optional[int] = None
    ) -> List[Maquina]:
        query = select(Maquina).options(selectinload(Maquina.puestos)).where(Maquina.eliminada == False)
        if salon_id:
            query = query.where(Maquina.salon_id == salon_id)
        
        result = await db.execute(query.offset(skip).limit(limit))
        return result.scalars().all()

    async def create(self, db: AsyncSession, *, obj_in: MaquinaCreate) -> Maquina:
        db_obj = Maquina(
            salon_id=obj_in.salon_id,
            tipo_maquina_id=obj_in.tipo_maquina_id,
            grupo_id=obj_in.grupo_id,
            nombre=obj_in.nombre,
            nombre_referencia_uorsa=obj_in.nombre_referencia_uorsa,
            numero_serie=obj_in.numero_serie,
            es_multipuesto=obj_in.es_multipuesto,
            tasa_semanal_override=obj_in.tasa_semanal_override,
            observaciones=obj_in.observaciones,
            activo=obj_in.activo,
            eliminada=False,
            fecha_alta=obj_in.fecha_alta,
            fecha_baja=obj_in.fecha_baja,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)

        # Determine rate for Puestos
        rate = obj_in.tasa_semanal_override
        if rate is None:
             tm_res = await db.execute(select(TipoMaquina).where(TipoMaquina.id == obj_in.tipo_maquina_id))
             tm = tm_res.scalars().first()
             if tm:
                 rate = tm.tasa_semanal_orientativa
             else:
                 rate = 0

        # Create Puestos
        qty = 1
        if obj_in.es_multipuesto:
            qty = obj_in.cantidad_puestos_iniciales if obj_in.cantidad_puestos_iniciales and obj_in.cantidad_puestos_iniciales > 0 else 1
        
        for i in range(1, qty + 1):
            puesto = Puesto(
                maquina_id=db_obj.id,
                numero_puesto=i,
                descripcion=f"Puesto {i}",
                tasa_semanal=rate,
                activo=True,
                eliminado=False
            )
            db.add(puesto)
        
        await db.commit()
        # Refresh with eager loading to avoid MissingGreenlet error on serialization
        result = await db.execute(
            select(Maquina)
            .options(selectinload(Maquina.puestos))
            .where(Maquina.id == db_obj.id)
        )
        return result.scalars().first()

    async def update(
        self,
        db: AsyncSession,
        *,
        db_obj: Maquina,
        obj_in: Union[MaquinaUpdate, Dict[str, Any]]
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
        
        # Cascade Active status to Puestos
        if 'activo' in update_data:
             target_status = update_data['activo']
             # Fetch puestos
             result = await db.execute(select(Puesto).where(Puesto.maquina_id == db_obj.id))
             puestos = result.scalars().all()
             for p in puestos:
                 p.activo = target_status
                 db.add(p)

        await db.commit()
        # Refresh with eager loading
        result = await db.execute(
            select(Maquina)
            .options(selectinload(Maquina.puestos))
            .where(Maquina.id == db_obj.id)
        )
        return result.scalars().first()

    async def remove(self, db: AsyncSession, *, id: int) -> Optional[Maquina]:
        # Soft delete
        result = await db.execute(select(Maquina).where(Maquina.id == id))
        obj = result.scalars().first()
        if obj:
            obj.eliminada = True
            obj.activo = False 
            db.add(obj)
            
            # Cascade to Puestos
            p_result = await db.execute(select(Puesto).where(Puesto.maquina_id == id))
            puestos = p_result.scalars().all()
            for p in puestos:
                p.eliminado = True
                p.activo = False
                db.add(p)
            
            await db.commit()
        return obj


class CRUDPuesto:
    async def get(self, db: AsyncSession, id: int) -> Optional[Puesto]:
        result = await db.execute(select(Puesto).where(Puesto.id == id, Puesto.eliminado == False))
        return result.scalars().first()

    async def create(self, db: AsyncSession, *, obj_in: PuestoCreate) -> Puesto:
        # Check if puesto number already exists for this machine (including soft-deleted)
        result = await db.execute(
            select(Puesto).where(
                Puesto.maquina_id == obj_in.maquina_id,
                Puesto.numero_puesto == obj_in.numero_puesto
            )
        )
        existing_puesto = result.scalars().first()

        if existing_puesto:
            if not existing_puesto.eliminado:
                # Already exists and active - The API Endpoint should catch this ValueError and turn into 400
                raise ValueError(f"El puesto {obj_in.numero_puesto} ya existe en esta máquina.")
            
            # Restore soft-deleted puesto
            existing_puesto.eliminado = False
            existing_puesto.activo = obj_in.activo if obj_in.activo is not None else True
            existing_puesto.descripcion = obj_in.descripcion if obj_in.descripcion else f"Puesto {obj_in.numero_puesto}"
            existing_puesto.tasa_semanal = obj_in.tasa_semanal
            
            db.add(existing_puesto)
            await db.commit()
            await db.refresh(existing_puesto)
            return existing_puesto

        db_obj = Puesto(
            maquina_id=obj_in.maquina_id,
            numero_puesto=obj_in.numero_puesto,
            descripcion=obj_in.descripcion if obj_in.descripcion else f"Puesto {obj_in.numero_puesto}",
            tasa_semanal=obj_in.tasa_semanal,
            activo=obj_in.activo,
            eliminado=False
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(self, db: AsyncSession, *, db_obj: Puesto, obj_in: Union[PuestoUpdate, Dict[str, Any]]) -> Puesto:
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

    async def remove(self, db: AsyncSession, *, id: int) -> Optional[Puesto]:
        # Soft delete
        result = await db.execute(select(Puesto).where(Puesto.id == id))
        obj = result.scalars().first()
        if obj:
            obj.eliminado = True
            obj.activo = False 
            db.add(obj)
            await db.commit()
        return obj

tipo_maquina = CRUDTipoMaquina()
maquina = CRUDMaquina()
grupo_maquina = CRUDGrupoMaquina()
puesto = CRUDPuesto()
