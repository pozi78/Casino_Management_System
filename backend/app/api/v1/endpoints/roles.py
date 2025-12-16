from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api import deps
from app.db.session import get_db
from app.models.user import Rol
from app.schemas.role import Role

router = APIRouter()

@router.get("/", response_model=List[Role])
async def read_roles(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve roles.
    """
    result = await db.execute(select(Rol).offset(skip).limit(limit))
    roles = result.scalars().all()
    return roles
