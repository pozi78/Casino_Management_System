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
    
    # Check for duplicate email
    result = await db.execute(select(Usuario).where(Usuario.email == user_in.email))
    user = result.scalars().first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    # Check for duplicate username
    result = await db.execute(select(Usuario).where(Usuario.username == user_in.username))
    user = result.scalars().first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    
    encoded_password = security.get_password_hash(user_in.password)
    db_obj = Usuario(
        email=user_in.email,
        username=user_in.username,
        hash_password=encoded_password,
        nombre=user_in.nombre,
        activo=user_in.activo,
        telefono=user_in.telefono,
        telegram_user=user_in.telegram_user,
        cargo=user_in.cargo,
        departamento=user_in.departamento,
        codigo_empleado=user_in.codigo_empleado,
        dni=user_in.dni,
        direccion_postal=user_in.direccion_postal,
        notas=user_in.notas
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
                virtual_assignments.append({
                    "salon_id": salon.id,
                    "usuario_id": current_user.id,
                    "puede_ver": True,
                    "puede_editar": True,
                    "salon": salon
                })
        
        user_dict = jsonable_encoder(current_user)
        user_dict['salones_asignados'] = virtual_assignments
        return user_dict

    return current_user

@router.get("/", response_model=List[User])
async def read_users(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve users.
    """
    from sqlalchemy.orm import selectinload
    from app.models.user import UsuarioSalon

    result = await db.execute(
        select(Usuario)
        .options(
            selectinload(Usuario.salones_asignados).selectinload(UsuarioSalon.salon)
        )
        .offset(skip).limit(limit)
    )
    users = result.scalars().all()
    return users

@router.get("/{user_id}", response_model=User)
async def read_user_by_id(
    user_id: int,
    current_user: Usuario = Depends(deps.get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Get a specific user by id.
    """
    from sqlalchemy.orm import selectinload
    from app.models.user import UsuarioSalon

    result = await db.execute(
        select(Usuario)
        .options(
            selectinload(Usuario.salones_asignados).selectinload(UsuarioSalon.salon)
        )
        .where(Usuario.id == user_id)
    )
    user = result.scalars().first()
    if user and user.id == current_user.id:
        return user # use caching/logic from read_user_me if needed, but simple return is ok
        
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this username does not exist in the system",
        )
    return user

@router.put("/{user_id}", response_model=User)
async def update_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_id: int,
    user_in: UserUpdate,
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a user.
    """
    from sqlalchemy.orm import selectinload
    from app.models.user import UsuarioSalon
    
    result = await db.execute(
        select(Usuario)
        .options(
            selectinload(Usuario.salones_asignados).selectinload(UsuarioSalon.salon)
        )
        .where(Usuario.id == user_id)
    )
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this username does not exist in the system",
        )
    
    update_data = user_in.dict(exclude_unset=True)
    if update_data.get("password"):
        hashed_password = security.get_password_hash(update_data["password"])
        del update_data["password"]
        update_data["hash_password"] = hashed_password
        
    for field, value in update_data.items():
        setattr(user, field, value)
        
    db.add(user)
    await db.commit()
    await db.refresh(user)
    # Re-fetch to ensure relationships are loaded for response
    # Or rely on expire_on_commit=False if set. 
    # Safest is to rely on the already loaded relationships or reload.
    # Since we did refresh, they might be unloaded.
    
    result = await db.execute(
        select(Usuario)
        .options(
            selectinload(Usuario.salones_asignados).selectinload(UsuarioSalon.salon)
        )
        .where(Usuario.id == user_id)
    )
    user = result.scalars().first()
    
    return user

@router.delete("/{user_id}", response_model=User)
async def delete_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_id: int,
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a user.
    """
    from sqlalchemy.orm import selectinload
    from app.models.user import UsuarioSalon

    # Prevent deleting yourself
    if current_user.id == user_id:
         raise HTTPException(
            status_code=400,
            detail="Users cannot delete themselves",
        )

    result = await db.execute(
        select(Usuario)
        .options(
            selectinload(Usuario.salones_asignados).selectinload(UsuarioSalon.salon)
        )
        .where(Usuario.id == user_id)
    )
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this username does not exist in the system",
        )
    
    await db.delete(user)
    await db.commit()
    return user
