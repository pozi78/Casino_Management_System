from typing import Any, List, Optional
from collections import defaultdict
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

@router.get("/filters-metadata")
async def get_filters_metadata(
    db: AsyncSession = Depends(get_db),
    years: Optional[List[int]] = Query(None),
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> Any:
    # Get Years
    q_years = select(func.extract('year', Recaudacion.fecha_fin)).where(Recaudacion.fecha_fin.isnot(None)).distinct().order_by(func.extract('year', Recaudacion.fecha_fin).desc())
    
    q_dates = select(Recaudacion.fecha_fin).where(Recaudacion.fecha_fin.isnot(None))
    result_dates = await db.execute(q_dates)
    dates = result_dates.scalars().all()
    years_list = sorted(list(set(d.year for d in dates if d)), reverse=True)

    # Get Machines
    # Logic: Show currently active machines AND machines that had activity in the selected years (historical).
    
    # 1. Base: Active machines
    q_machines = select(Maquina.id, Maquina.nombre, Maquina.salon_id).where(Maquina.activo == True)
    
    # 2. If years selected, add machines that had revenue in those years
    if years:
        from app.models.recaudacion import RecaudacionMaquina
        subq_historical = (
            select(RecaudacionMaquina.maquina_id)
            .join(Recaudacion)
            .where(func.extract('year', Recaudacion.fecha_fin).in_(years))
        )
        # Combine: Active OR ID in historical
        q_machines = select(Maquina.id, Maquina.nombre, Maquina.salon_id).where(
            (Maquina.activo == True) | (Maquina.id.in_(subq_historical))
        )
    
    q_machines = q_machines.order_by(Maquina.nombre)
    
    result_machines = await db.execute(q_machines)
    # Use a dictionary to remove duplicates by ID if any (though OR in SQL should handle it, explicit distinct is safer or just dict)
    # SQLAlchemy's distinct() on the whole row works.
    machines_map = {m.id: {"id": m.id, "name": m.nombre, "salon_id": m.salon_id} for m in result_machines.all()}
    machines = list(machines_map.values())
    
    # Get Months (Static)
    months = [{"id": i, "name": n} for i, n in enumerate(["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"], start=1)]

    return {
        "years": years_list,
        "months": months,
        "machines": machines
    }

def apply_common_filters(query, model, salon_ids, years, months):
    # Model is typically Recaudacion or RecaudacionMaquina (joined with Recaudacion)
    # If model is RecaudacionMaquina, we assume it's joined with Recaudacion usually, or we join it.
    
    # We need to access the Recaudacion entity for date filtering.
    # If model is Recaudacion, use it directly.
    # If model is RecaudacionMaquina, check if Recaudacion is joined or available via relationship?
    # Actually, the caller should handle the join if needed.
    # We will assume 'Recaudacion' class is the target for date/salon filters.
    
    if salon_ids:
        query = query.where(Recaudacion.salon_id.in_(salon_ids))
        
    # Date filters need expression on Recaudacion.fecha_fin
    # Complex if using SQL 'extract' for portable years/months.
    # We will accept fetching more and filtering in python IF implementation is hard in SQL.
    # But for optimization, let's try basic SQL where possible (ranges) or just fetch all for now and filter python side?
    # No, filtering python side for ALL data is bad.
    # Let's filter by year/month using generic func if possible.
    
    if years:
        # SQLite: strftime('%Y', col)
        # Postgres: extract(year from col)
        # generic: extract('year', col)
        query = query.where(func.extract('year', Recaudacion.fecha_fin).in_(years))
        
    if months:
         query = query.where(func.extract('month', Recaudacion.fecha_fin).in_(months))
         
    return query

@router.get("/dashboard")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    salon_ids: Optional[List[int]] = Query(None),
    years: Optional[List[int]] = Query(None),
    months: Optional[List[int]] = Query(None),
    machine_ids: Optional[List[int]] = Query(None),
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get statistics for the dashboard.
    """
    
    # 1. Salones Operativos & Usuarios: Ignore time filters? usually yes, "current state".
    # 2. Machines Active: Only apply salon/machine filters.
    
    query_salons = select(func.count(Salon.id)).where(Salon.activo == True)
    if salon_ids:
        query_salons = query_salons.where(Salon.id.in_(salon_ids))
    count_salons = await db.scalar(query_salons) or 0
    
    query_users = select(func.count(Usuario.id)).where(Usuario.activo == True)
    count_users = await db.scalar(query_users) or 0
    
    query_machines = select(func.count(Maquina.id)).where(Maquina.activo == True)
    if salon_ids:
        query_machines = query_machines.where(Maquina.salon_id.in_(salon_ids))
    if machine_ids:
        query_machines = query_machines.where(Maquina.id.in_(machine_ids))
    count_machines = await db.scalar(query_machines) or 0

    # 4. Ingresos Totales
    # Logic split:
    # If machine_ids IS set: We MUST aggregate RecaudacionMaquina
    # If machine_ids IS NOT set: We use Recaudacion (legacy logic with global adjustments)
    
    # 4. Ingresos Totales
    # Logic split:
    # If machine_ids IS set: We MUST aggregate RecaudacionMaquina
    # If machine_ids IS NOT set: We use Recaudacion (legacy logic with global adjustments)
    
    income_by_year = defaultdict(float)
    income_by_year_salon = defaultdict(lambda: defaultdict(float))
    total_income_shared = 0
    
    if machine_ids:
        from app.models.recaudacion import RecaudacionMaquina
        # Need date and salon from Recaudacion
        # Ensure salon is loaded.
        q = select(RecaudacionMaquina).join(Recaudacion).options(
            selectinload(RecaudacionMaquina.maquina), 
            selectinload(RecaudacionMaquina.recaudacion).selectinload(Recaudacion.salon)
        )
        
        # Apply filters
        q = apply_common_filters(q, RecaudacionMaquina, salon_ids, years, months)
        q = q.where(RecaudacionMaquina.maquina_id.in_(machine_ids))
        
        result = await db.execute(q)
        details = result.scalars().all()
        
        for d in details:
             if not d.recaudacion or not d.recaudacion.fecha_fin: continue
             
             # Logic for machine net
             bruto = (d.retirada_efectivo or 0) + (d.cajon or 0) - (d.pago_manual or 0) + (d.tasa_ajuste or 0)
             neto = bruto - (d.tasa_calculada or 0)
             val_shared = float(neto) / 2
             
             total_income_shared += val_shared
             year = d.recaudacion.fecha_fin.year
             income_by_year[year] += val_shared
             
             salon_name = d.recaudacion.salon.nombre if d.recaudacion.salon else "Unknown"
             income_by_year_salon[year][salon_name] += val_shared
        
    else:
        # Standard logic
        # Ensure salon is loaded
        q = select(Recaudacion).options(selectinload(Recaudacion.detalles), selectinload(Recaudacion.salon))
        q = apply_common_filters(q, Recaudacion, salon_ids, years, months)
        
        result = await db.execute(q)
        recaudaciones = result.scalars().all()
        
        for r in recaudaciones:
            if not r.fecha_fin: continue
            val_shared = float(r.total_global or 0) / 2
            
            total_income_shared += val_shared
            year = r.fecha_fin.year
            income_by_year[year] += val_shared
            
            salon_name = r.salon.nombre if r.salon else "Unknown"
            income_by_year_salon[year][salon_name] += val_shared

    # Format annual breakdown
    # transform income_by_year_salon to list of { anio: 2024, total: X, salones: { "A": 1, "B": 2 } }
    breakdown = []
    for year in sorted(income_by_year.keys(), reverse=True):
        entry = {
            "anio": year,
            "total": income_by_year[year],
            "salones": income_by_year_salon[year]
        }
        breakdown.append(entry)

    return {
        "ingresos_totales": total_income_shared,
        "ingresos_por_anio": breakdown,
        "usuarios_activos": count_users,
        "salones_operativos": count_salons,
        "maquinas_activas": count_machines
    }

@router.get("/revenue-evolution")
async def get_revenue_evolution(
    db: AsyncSession = Depends(get_db),
    salon_ids: Optional[List[int]] = Query(None),
    years: Optional[List[int]] = Query(None),
    months: Optional[List[int]] = Query(None),
    machine_ids: Optional[List[int]] = Query(None),
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> Any:
    
    grouped_data = defaultdict(lambda: defaultdict(float))
    month_names = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    
    if machine_ids:
        from app.models.recaudacion import RecaudacionMaquina
        q = select(RecaudacionMaquina).join(Recaudacion).options(selectinload(RecaudacionMaquina.recaudacion))
        q = apply_common_filters(q, RecaudacionMaquina, salon_ids, years, months)
        q = q.where(RecaudacionMaquina.maquina_id.in_(machine_ids))
        
        result = await db.execute(q)
        details = result.scalars().all()
        
        for d in details:
            if not d.recaudacion or not d.recaudacion.fecha_fin: continue
            
            # Logic for machine net
            bruto = (d.retirada_efectivo or 0) + (d.cajon or 0) - (d.pago_manual or 0) + (d.tasa_ajuste or 0)
            neto = bruto - (d.tasa_calculada or 0)
            val = float(neto) / 2
            
            year = d.recaudacion.fecha_fin.year
            month_idx = d.recaudacion.fecha_fin.month - 1
            grouped_data[month_idx][str(year)] += val
            
    else:
        q = select(Recaudacion).options(selectinload(Recaudacion.detalles))
        q = apply_common_filters(q, Recaudacion, salon_ids, years, months)
        q = q.order_by(Recaudacion.fecha_fin) # simple sort
        
        result = await db.execute(q)
        recaudaciones = result.scalars().all()
        
        for r in recaudaciones:
            if not r.fecha_fin: continue
            
            val = float(r.total_global or 0) / 2
            year = r.fecha_fin.year
            month_idx = r.fecha_fin.month - 1
            grouped_data[month_idx][str(year)] += val

    # Convert to list for Recharts
    chart_data = []
    for i in range(12):
        item = {"name": month_names[i]}
        for year_key, value in grouped_data[i].items():
            item[year_key] = round(value, 2)
        item["total"] = round(sum(grouped_data[i].values()), 2)
        chart_data.append(item)
        
    return chart_data

@router.get("/revenue-by-salon")
async def get_revenue_by_salon(
    db: AsyncSession = Depends(get_db),
    salon_ids: Optional[List[int]] = Query(None),
    years: Optional[List[int]] = Query(None),
    months: Optional[List[int]] = Query(None),
    machine_ids: Optional[List[int]] = Query(None),
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> Any:
    
    data = defaultdict(float)
    
    if machine_ids:
        from app.models.recaudacion import RecaudacionMaquina
        q = select(RecaudacionMaquina).join(Recaudacion).options(selectinload(Recaudacion.salon))
        q = apply_common_filters(q, RecaudacionMaquina, salon_ids, years, months)
        q = q.where(RecaudacionMaquina.maquina_id.in_(machine_ids))
        
        result = await db.execute(q)
        details = result.scalars().all()
        
        for d in details:
            if not d.recaudacion: continue
            salon = d.recaudacion.salon
            salon_name = salon.nombre if salon else f"Unknown"
            
            bruto = (d.retirada_efectivo or 0) + (d.cajon or 0) - (d.pago_manual or 0) + (d.tasa_ajuste or 0)
            neto = bruto - (d.tasa_calculada or 0)
            val = float(neto) / 2
            data[salon_name] += val
    else:
        q = select(Recaudacion).options(selectinload(Recaudacion.salon))
        q = apply_common_filters(q, Recaudacion, salon_ids, years, months)
        
        result = await db.execute(q)
        recaudaciones = result.scalars().all()
        
        for r in recaudaciones:
            salon_name = r.salon.nombre if r.salon else f"Salon {r.salon_id}"
            val = float(r.total_global or 0) / 2
            data[salon_name] += val
            
    sorted_data = [{"name": k, "value": round(v, 2)} for k, v in sorted(data.items(), key=lambda x: x[1], reverse=True)]
    return sorted_data

@router.get("/top-machines")
async def get_top_machines(
    db: AsyncSession = Depends(get_db),
    salon_ids: Optional[List[int]] = Query(None),
    years: Optional[List[int]] = Query(None),
    months: Optional[List[int]] = Query(None),
    machine_ids: Optional[List[int]] = Query(None),
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> Any:
    from app.models.recaudacion import RecaudacionMaquina
    from collections import defaultdict
    
    q = select(RecaudacionMaquina).join(Recaudacion).options(
        selectinload(RecaudacionMaquina.maquina),
        selectinload(RecaudacionMaquina.recaudacion).selectinload(Recaudacion.salon)
    )
    
    q = apply_common_filters(q, RecaudacionMaquina, salon_ids, years, months)
    
    if machine_ids:
        q = q.where(RecaudacionMaquina.maquina_id.in_(machine_ids))
        
    result = await db.execute(q)
    detalles = result.scalars().all()
    
    stats = defaultdict(lambda: {"bruto": 0.0, "tasa": 0.0, "neto": 0.0, "salon": "Unknown"})
    
    for d in detalles:
        # Calculate net for this machine entry
        bruto = (d.retirada_efectivo or 0) + (d.cajon or 0) - (d.pago_manual or 0) + (d.tasa_ajuste or 0)
        tasa = (d.tasa_calculada or 0)
        neto = bruto - tasa
        
        # User gets 50%
        # Accumulate each component separately
        m_name = d.maquina.nombre if d.maquina else f"Maq {d.maquina_id}"
        salon_name = d.recaudacion.salon.nombre if d.recaudacion and d.recaudacion.salon else "Unknown"
        
        # Use a unique key combining machine and salon to handle potential name collisions if any, 
        # though usually machine names are unique or ID based. 
        # But here we aggregate by NAME as per previous logic.
        # Ideally we should aggregate by ID, but existing logic used name.
        # We will append Salon to name to make it unique per salon.
        
        full_name = f"{m_name} ({salon_name})"
        
        stats[full_name]["bruto"] += float(bruto) / 2
        stats[full_name]["tasa"] += float(tasa) / 2
        stats[full_name]["neto"] += float(neto) / 2

    # Return ALL (no limit) sorted by Neto
    # Flatten structure for frontend
    top_list = []
    for k, v in sorted(stats.items(), key=lambda x: x[1]["neto"], reverse=True):
        top_list.append({
            "name": k,
            "bruto": round(v["bruto"], 2),
            "tasa": round(v["tasa"], 2),
            "neto": round(v["neto"], 2)
        })
        
    return top_list
