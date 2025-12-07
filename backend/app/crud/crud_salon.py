from typing import List, Optional
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.salon import Salon
from app.schemas.salon import SalonCreate, SalonUpdate

class CRUDSalon:
    async def get(self, db: AsyncSession, id: int) -> Optional[Salon]:
        result = await db.execute(select(Salon).where(Salon.id == id))
        return result.scalars().first()

    async def get_multi(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> List[Salon]:
        result = await db.execute(select(Salon).order_by(Salon.id).offset(skip).limit(limit))
        return result.scalars().all()

    async def create(self, db: AsyncSession, *, obj_in: SalonCreate) -> Salon:
        # Create with temporary code if not provided
        db_obj = Salon(
            nombre=obj_in.nombre,
            direccion=obj_in.direccion,
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
        db_obj: Salon,
        obj_in: SalonUpdate | dict
    ) -> Salon:
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

    async def remove(self, db: AsyncSession, *, id: int) -> Optional[Salon]:
        result = await db.execute(select(Salon).where(Salon.id == id))
        obj = result.scalars().first()
        if obj:
            await db.delete(obj)
            await db.commit()
        return obj

salon = CRUDSalon()
