from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app import crud, models
from app.api import deps
from app.schemas.salon import Salon, SalonCreate, SalonUpdate

router = APIRouter()

@router.get("/", response_model=List[Salon])
async def read_salones(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    show_deleted: bool = False,
    current_user: models.Usuario = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve salones.
    """
    if show_deleted:
         # Refetch user to load roles
         stmt = select(models.Usuario).options(selectinload(models.Usuario.roles)).where(models.Usuario.id == current_user.id)
         result = await db.execute(stmt)
         user_with_roles = result.scalars().first()
         
         # Check if Superadmin or Admin
         user_roles = [r.nombre for r in user_with_roles.roles]
         is_admin = 'Superadmin' in user_roles 
         
         if not any(r in ['Superadmin'] for r in user_roles) and current_user.username != 'admin':
             raise HTTPException(status_code=403, detail="Not enough permissions to view deleted items")
             
    # Permission Check (Redundant but safe to keep logic clean)
    # The above block already checks. if show_deleted is false, we don't check.
            
    salones = await crud.salon.get_multi(db, skip=skip, limit=limit, include_deleted=show_deleted)
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

@router.post("/{salon_id}/restore", response_model=Salon)
async def restore_salon(
    *,
    db: AsyncSession = Depends(deps.get_db),
    salon_id: int,
    current_user: models.Usuario = Depends(deps.get_current_active_user),
) -> Any:
    """
    Restore a deleted salon.
    """
    # Refetch user to load roles
    stmt = select(models.Usuario).options(selectinload(models.Usuario.roles)).where(models.Usuario.id == current_user.id)
    result = await db.execute(stmt)
    user_with_roles = result.scalars().first()

    # Check permissions (Superadmin)
    is_super = user_with_roles.username == 'admin' or any(r.nombre == 'Superadmin' for r in user_with_roles.roles)
    if not is_super:
        raise HTTPException(status_code=403, detail="Not enough permissions to restore items")

    salon = await crud.salon.restore(db=db, id=salon_id)
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")
    return salon
