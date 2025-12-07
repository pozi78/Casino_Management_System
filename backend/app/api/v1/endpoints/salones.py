from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud, models
from app.api import deps
from app.schemas.salon import Salon, SalonCreate, SalonUpdate

router = APIRouter()

@router.get("/", response_model=List[Salon])
async def read_salones(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.Usuario = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve salones.
    """
    salones = await crud.salon.get_multi(db, skip=skip, limit=limit)
    return salones

@router.post("/", response_model=Salon)
async def create_salon(
    *,
    db: AsyncSession = Depends(deps.get_db),
    salon_in: SalonCreate,
    current_user: models.Usuario = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new salon.
    """
    # Here allows creation by any active user. Ideally check for generic 'admin' role permissions
    salon = await crud.salon.create(db=db, obj_in=salon_in)
    return salon

@router.put("/{salon_id}", response_model=Salon)
async def update_salon(
    *,
    db: AsyncSession = Depends(deps.get_db),
    salon_id: int,
    salon_in: SalonUpdate,
    current_user: models.Usuario = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a salon.
    """
    salon = await crud.salon.get(db=db, id=salon_id)
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")
    salon = await crud.salon.update(db=db, db_obj=salon, obj_in=salon_in)
    return salon

@router.get("/{salon_id}", response_model=Salon)
async def read_salon(
    *,
    db: AsyncSession = Depends(deps.get_db),
    salon_id: int,
    current_user: models.Usuario = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get salon by ID.
    """
    salon = await crud.salon.get(db=db, id=salon_id)
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")
    return salon

@router.delete("/{salon_id}", response_model=Salon)
async def delete_salon(
    *,
    db: AsyncSession = Depends(deps.get_db),
    salon_id: int,
    current_user: models.Usuario = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a salon.
    """
    salon = await crud.salon.get(db=db, id=salon_id)
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")
    salon = await crud.salon.remove(db=db, id=salon_id)
    return salon
