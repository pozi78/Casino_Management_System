from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from sqlalchemy.orm import selectinload

from app.api import deps
from app.db.session import get_db
from app.models.user import Usuario
from app.models.salon import Salon
from app.models.machine import Maquina
from app.models.recaudacion import Recaudacion

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    salon_ids: Optional[List[int]] = Query(None),
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get statistics for the dashboard.
    """
    
    # 1. Salones Operativos
    query_salons = select(func.count(Salon.id)).where(Salon.activo == True)
    if salon_ids:
        query_salons = query_salons.where(Salon.id.in_(salon_ids))
    
    count_salons = await db.scalar(query_salons) or 0

    # 2. Usuarios Activos (Global count)
    query_users = select(func.count(Usuario.id)).where(Usuario.activo == True)
    count_users = await db.scalar(query_users) or 0

    # 3. Maquinas en Uso
    query_machines = select(func.count(Maquina.id)).where(Maquina.activo == True)
    if salon_ids:
        query_machines = query_machines.where(Maquina.salon_id.in_(salon_ids))
    
    count_machines = await db.scalar(query_machines) or 0

    # 4. Ingresos Totales
    # Sum of Recaudacion.total_global / 2
    query_recaudacion = select(Recaudacion)
    if salon_ids:
         query_recaudacion = query_recaudacion.where(Recaudacion.salon_id.in_(salon_ids))
    
    # Perform eager load to ensure properties work efficiently
    query_recaudacion = query_recaudacion.options(selectinload(Recaudacion.detalles))
    
    result_recaudacion = await db.execute(query_recaudacion)
    recaudaciones = result_recaudacion.scalars().all()
    
    total_income = sum((r.total_global or 0) for r in recaudaciones)
    total_income_shared = total_income / 2

    return {
        "ingresos_totales": total_income_shared,
        "usuarios_activos": count_users,
        "salones_operativos": count_salons,
        "maquinas_activas": count_machines
    }
