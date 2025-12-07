from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.crud.crud_recaudacion import recaudacion, recaudacion_maquina
from app.schemas.recaudacion import (
    Recaudacion as RecaudacionSchema, RecaudacionSummary, RecaudacionCreate, RecaudacionUpdate,
    RecaudacionMaquina as RecaudacionMaquinaSchema, RecaudacionMaquinaUpdate
)
from app.api import deps
from app.models.user import Usuario

router = APIRouter()

@router.get("/", response_model=List[RecaudacionSummary])
async def read_recaudaciones(
    skip: int = 0,
    limit: int = 100,
    salon_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve recaudaciones.
    """
    recaudaciones = await recaudacion.get_multi(db, skip=skip, limit=limit, salon_id=salon_id)
    return recaudaciones

@router.post("/", response_model=RecaudacionSchema)
async def create_recaudacion(
    recaudacion_in: RecaudacionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new recaudacion and auto-generate machine details.
    """
    recaudacion_obj = await recaudacion.create_with_initial_details(db, obj_in=recaudacion_in)
    return recaudacion_obj

@router.get("/{id}", response_model=RecaudacionSchema)
async def read_recaudacion(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get recaudacion by ID.
    """
    recaudacion_obj = await recaudacion.get(db, id=id)
    if not recaudacion_obj:
        raise HTTPException(status_code=404, detail="Recaudacion not found")
    return recaudacion_obj

@router.put("/{id}", response_model=RecaudacionSchema)
async def update_recaudacion(
    id: int,
    recaudacion_in: RecaudacionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update recaudacion header.
    """
    recaudacion_obj = await recaudacion.get(db, id=id)
    if not recaudacion_obj:
        raise HTTPException(status_code=404, detail="Recaudacion not found")
    recaudacion_updated = await recaudacion.update(db, db_obj=recaudacion_obj, obj_in=recaudacion_in)
    return recaudacion_updated

# --- Detail Endpoints ---

@router.put("/details/{detail_id}", response_model=RecaudacionMaquinaSchema)
async def update_recaudacion_detail(
    detail_id: int,
    detail_in: RecaudacionMaquinaUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a specific machine line (retirada, cajon, etc).
    """
    detail_obj = await recaudacion_maquina.get(db, id=detail_id)
    if not detail_obj:
        raise HTTPException(status_code=404, detail="Recaudacion Detail not found")
    
    # We could check here if Recaudacion is closed/locked if we had that logic
    
    updated_detail = await recaudacion_maquina.update(db, db_obj=detail_obj, obj_in=detail_in)
    return updated_detail

@router.delete("/{id}", response_model=RecaudacionSchema)
async def delete_recaudacion(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete recaudacion.
    """
    recaudacion_obj = await recaudacion.get(db, id=id)
    if not recaudacion_obj:
        raise HTTPException(status_code=404, detail="Recaudacion not found")
    recaudacion_deleted = await recaudacion.remove(db, id=id)
    return recaudacion_deleted
