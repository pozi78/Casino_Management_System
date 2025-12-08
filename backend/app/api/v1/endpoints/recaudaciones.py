from typing import Any, List, Optional
from datetime import datetime
import shutil
import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from fastapi.responses import FileResponse
from jose import jwt, JWTError
from pydantic import ValidationError
from app.core.config import settings
from app.schemas.token import TokenPayload
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_db
from app.crud.crud_recaudacion import recaudacion, recaudacion_maquina
from app.schemas.recaudacion import (
    Recaudacion as RecaudacionSchema, RecaudacionSummary, RecaudacionCreate, RecaudacionUpdate,
    RecaudacionMaquina as RecaudacionMaquinaSchema, RecaudacionMaquinaUpdate,
    RecaudacionFichero as RecaudacionFicheroSchema
)
from app.models.recaudacion import RecaudacionFichero
from app.api import deps
from app.models.user import Usuario

router = APIRouter()

@router.get("/last", response_model=Optional[datetime])
async def get_last_recaudacion_date(
    salon_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get the end date of the last Recaudacion for a Salon.
    Used for auto-filling the start date of the next one.
    """
    # Order by start date descending, get most recent
    recaudaciones = await recaudacion.get_multi(db, skip=0, limit=1, salon_id=salon_id)
    if recaudaciones:
        return recaudaciones[0].fecha_fin
    return None

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

# --- File Handling ---

UPLOAD_DIR = "/opt/CasinosSM/backend/uploads/recaudaciones"

@router.post("/{id}/files", response_model=RecaudacionFicheroSchema)
async def upload_recaudacion_file(
    id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> Any:
    # Check if recaudacion exists
    rec = await recaudacion.get(db, id=id)
    if not rec:
        raise HTTPException(status_code=404, detail="Recaudacion not found")
        
    # Ensure directory exists
    rec_dir = os.path.join(UPLOAD_DIR, str(id))
    os.makedirs(rec_dir, exist_ok=True)
    
    # Save file
    file_path = os.path.join(rec_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Create DB Entry
    db_file = RecaudacionFichero(
        recaudacion_id=id,
        file_path=file_path,
        filename=file.filename,
        content_type=file.content_type,
        created_at=datetime.now()
    )
    db.add(db_file)
    await db.commit()
    await db.refresh(db_file)
    return db_file

@router.delete("/{id}/files/{file_id}")
async def delete_recaudacion_file(
    id: int,
    file_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> Any:
    stmt = select(RecaudacionFichero).where(RecaudacionFichero.id == file_id, RecaudacionFichero.recaudacion_id == id)
    result = await db.execute(stmt)
    db_file = result.scalars().first()
    
    if not db_file:
         raise HTTPException(status_code=404, detail="File not found")
         
    # Delete from Disk
    if os.path.exists(db_file.file_path):
        os.remove(db_file.file_path)
        
    await db.delete(db_file)
    await db.commit()
    return {"status": "success"}

@router.get("/files/{file_id}/content")
async def get_file_content(
    file_id: int,
    db: AsyncSession = Depends(get_db),
    token: Optional[str] = Query(None),
) -> Any:
    # Validate Token from Query Param
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        TokenPayload(**payload)
    except (JWTError, ValidationError):
        raise HTTPException(status_code=403, detail="Could not validate credentials")

    stmt = select(RecaudacionFichero).where(RecaudacionFichero.id == file_id)
    result = await db.execute(stmt)
    db_file = result.scalars().first()
    
    if not db_file or not os.path.exists(db_file.file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    return FileResponse(
        db_file.file_path, 
        media_type=db_file.content_type or "application/octet-stream",
        filename=db_file.filename,
        content_disposition_type="inline"
    )

@router.post("/{id}/import-excel")
async def import_recaudacion_excel(
    id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> Any:
    # Stub for Excel Import
    # In real impl: Parse Excel, update or create RecaudacionMaquina entries.
    return {"status": "not_implemented_yet", "filename": file.filename}
