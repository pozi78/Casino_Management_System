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
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user.
    """
    # Check if user is Admin / Superuser
    # We explicitly load roles to avoid DetachedInstanceError or LazyLoad issues in async
    from app.models.user import Rol
    result_roles = await db.execute(
        select(Rol)
        .join(Rol.usuarios)
        .where(Usuario.id == current_user.id)
    )
    user_roles = result_roles.scalars().all()
    
    is_admin = (
        current_user.username == 'admin' or 
        any(r.nombre in ['Admin', 'Superadmin', 'Administrador'] for r in user_roles)
    )
    
    if is_admin:
        # Fetch ALL salons
        from app.models.salon import Salon
        result = await db.execute(select(Salon))
        all_salons = result.scalars().all()
        
        # Create virtual assignments for all salons
        # We start with existing assignments to keep specific perms if any
        existing_ids = {ua.salon_id for ua in current_user.salones_asignados}
        
        virtual_assignments = list(current_user.salones_asignados)
        
        for salon in all_salons:
            if salon.id not in existing_ids:
                # Add synthetic assignment with full permissions
                # Note: We return a structure matching UsuarioSalon schema/model
                # We can construct a dict or simple object
                virtual_assignments.append({
                    "salon_id": salon.id,
                    "usuario_id": current_user.id,
                    "puede_ver": True,
                    "puede_editar": True,
                    "salon": salon
                })
        
        # We need to ensure the response matches the Pydantic User schema.
        # SQLAlchemy object `current_user` can be converted to dict and updated.
        user_dict = jsonable_encoder(current_user)
        user_dict['salones_asignados'] = virtual_assignments
        return user_dict

    return current_user
