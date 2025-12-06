from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.crud.crud_machine import maquina, tipo_maquina
from app.schemas.machine import Maquina as MaquinaSchema, MaquinaCreate, MaquinaUpdate
from app.schemas.machine import TipoMaquina as TipoMaquinaSchema, TipoMaquinaCreate, TipoMaquinaUpdate

router = APIRouter()

# --- Tipo Maquina Endpoints ---

@router.get("/types", response_model=List[TipoMaquinaSchema])
async def read_machine_types(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Retrieve machine types.
    """
    types = await tipo_maquina.get_multi(db, skip=skip, limit=limit)
    return types

@router.post("/types", response_model=TipoMaquinaSchema)
async def create_machine_type(
    type_in: TipoMaquinaCreate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Create new machine type.
    """
    # Check for duplicate code if necessary here via CRUD generic check or specific query
    # For now direct create
    type_obj = await tipo_maquina.create(db, obj_in=type_in)
    return type_obj

# --- Maquina Endpoints ---

@router.get("/", response_model=List[MaquinaSchema])
async def read_machines(
    skip: int = 0,
    limit: int = 100,
    salon_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Retrieve machines.
    """
    machines = await maquina.get_multi(db, skip=skip, limit=limit, salon_id=salon_id)
    return machines

@router.post("/", response_model=MaquinaSchema)
async def create_machine(
    machine_in: MaquinaCreate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Create new machine.
    """
    machine = await maquina.create(db, obj_in=machine_in)
    return machine

@router.put("/{machine_id}", response_model=MaquinaSchema)
async def update_machine(
    machine_id: int,
    machine_in: MaquinaUpdate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Update a machine.
    """
    machine_obj = await maquina.get(db, id=machine_id)
    if not machine_obj:
        raise HTTPException(status_code=404, detail="Machine not found")
    machine = await maquina.update(db, db_obj=machine_obj, obj_in=machine_in)
    return machine

@router.delete("/{machine_id}", response_model=MaquinaSchema)
async def delete_machine(
    machine_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Delete a machine.
    """
    machine_obj = await maquina.get(db, id=machine_id)
    if not machine_obj:
        raise HTTPException(status_code=404, detail="Machine not found")
    machine = await maquina.remove(db, id=machine_id)
    return machine
