from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.crud.crud_machine import maquina, tipo_maquina, grupo_maquina
from app.schemas.machine import (
    Maquina as MaquinaSchema, MaquinaCreate, MaquinaUpdate,
    TipoMaquina as TipoMaquinaSchema, TipoMaquinaCreate, TipoMaquinaUpdate,
    GrupoMaquina as GrupoMaquinaSchema, GrupoMaquinaCreate, GrupoMaquinaUpdate
)

router = APIRouter()

# --- Grupo Maquina Endpoints ---

@router.get("/groups", response_model=List[GrupoMaquinaSchema])
async def read_machine_groups(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Retrieve machine groups.
    """
    groups = await grupo_maquina.get_multi(db, skip=skip, limit=limit)
    return groups

@router.post("/groups", response_model=GrupoMaquinaSchema)
async def create_machine_group(
    group_in: GrupoMaquinaCreate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Create new machine group.
    """
    group = await grupo_maquina.create(db, obj_in=group_in)
    return group

@router.put("/groups/{group_id}", response_model=GrupoMaquinaSchema)
async def update_machine_group(
    group_id: int,
    group_in: GrupoMaquinaUpdate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Update a machine group.
    """
    group_obj = await grupo_maquina.get(db, id=group_id)
    if not group_obj:
        raise HTTPException(status_code=404, detail="Machine Group not found")
    group = await grupo_maquina.update(db, db_obj=group_obj, obj_in=group_in)
    return group

@router.delete("/groups/{group_id}", response_model=GrupoMaquinaSchema)
async def delete_machine_group(
    group_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Delete a machine group.
    """
    group_obj = await grupo_maquina.get(db, id=group_id)
    if not group_obj:
        raise HTTPException(status_code=404, detail="Machine Group not found")
    group = await grupo_maquina.remove(db, id=group_id)
    return group

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
