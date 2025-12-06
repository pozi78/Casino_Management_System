from typing import Any, List
from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api import deps
from app.core import security
from app.db.session import get_db
from app.models.user import Usuario
from app.schemas.user import User, UserCreate, UserUpdate

router = APIRouter()

@router.post("/", response_model=User)
async def create_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_in: UserCreate,
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new user.
    """
    # TODO: Check permissions (Admin only)
    
    result = await db.execute(select(Usuario).where(Usuario.email == user_in.email))
    user = result.scalars().first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    encoded_password = security.get_password_hash(user_in.password)
    db_obj = Usuario(
        email=user_in.email,
        username=user_in.username,
        hash_password=encoded_password,
        nombre=user_in.nombre,
        activo=user_in.activo,
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

@router.get("/me", response_model=User)
async def read_user_me(
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user.
    """
    return current_user
