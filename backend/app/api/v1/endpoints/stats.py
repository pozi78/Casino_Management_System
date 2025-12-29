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
    salon_ids: Optional[List[int]] = Query(None),
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
    q_machines = select(Maquina.id, Maquina.nombre, Maquina.salon_id).join(Salon).where(Maquina.activo == True, Maquina.eliminada == False, Salon.deleted_at.is_(None))
    
    if salon_ids:
        q_machines = q_machines.where(Maquina.salon_id.in_(salon_ids))
    
    # 2. If years selected, add machines that had revenue in those years
    if years:
        from app.models.recaudacion import RecaudacionMaquina
        subq_historical_q = (
            select(RecaudacionMaquina.maquina_id)
            .join(Recaudacion)
            .where(func.extract('year', Recaudacion.fecha_fin).in_(years))
        )
        
        if salon_ids:
             subq_historical_q = subq_historical_q.where(Recaudacion.salon_id.in_(salon_ids))
             
        subq_historical = subq_historical_q
             
        # Combine: Active (filtered) OR ID in historical (filtered)
        # Note: If salon_ids is set, we only want machines that ARE in those salons (active or historical revenue in those salons)
        # However, a machine might have moved salons.
        # Requirement: "No deben aparecer las máquinas de los salones que no estan seleccionados"
        # If we filter simply by current salon_id, we miss historical machines that are now gone or moved?
        # But usually user expects "Machines associated with this salon". 
        # For historical: if a machine generated money in Salon A in 2024, and I select Salon A, I want to see it, even if it is now in Salon B?
        # That's complex. dashboard usually filters by "Current State" for list, OR "Revenue Source".
        # Let's assume standard filter:
        # Active: Current Salon must be in salon_ids.
        # Historical: Revenue must be from Recaudacion in salon_ids.
        
        # Actually easier:
        # We want list of machines relevant to the selection.
        # If I select Salon A, I want: 
        # 1. Machines currently in Salon A.
        # 2. Machines that generated money in Salon A in the selected years.
        
        # So the OR logic holds, but both sides need salon filter.
        
        q_machines = select(Maquina.id, Maquina.nombre, Maquina.salon_id).where(
            (
                (Maquina.activo == True) & 
                (Maquina.salon_id.in_(salon_ids) if salon_ids else True)
            ) 
            | 
            (Maquina.id.in_(subq_historical))
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
    
    query_salons = select(func.count(Salon.id)).where(Salon.activo == True, Salon.deleted_at.is_(None))
    if salon_ids:
        query_salons = query_salons.where(Salon.id.in_(salon_ids))
    count_salons = await db.scalar(query_salons) or 0
    
    query_users = select(func.count(Usuario.id)).where(Usuario.activo == True)
    count_users = await db.scalar(query_users) or 0
    
    query_machines = select(func.count(Maquina.id)).join(Salon).where(Maquina.activo == True, Maquina.eliminada == False, Salon.deleted_at.is_(None))
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
             bruto = (d.retirada_efectivo or 0) + (d.cajon or 0) - (d.pago_manual or 0) + (d.ajuste or 0)
             neto = bruto - (d.tasa_estimada or 0) - (d.tasa_diferencia or 0)
             neto = bruto - (d.tasa_estimada or 0) - (d.tasa_diferencia or 0)
             # SALON gets percentage_salon% 
             pct_salon = float(d.recaudacion.porcentaje_salon or 50) / 100.0
             val_shared = float(neto) * pct_salon
             
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
            # SALON gets percentage_salon%
            pct_salon = float(r.porcentaje_salon or 50) / 100.0
            val_shared = float(r.total_global or 0) * pct_salon
            
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
            bruto = (d.retirada_efectivo or 0) + (d.cajon or 0) - (d.pago_manual or 0) + (d.ajuste or 0)
            neto = bruto - (d.tasa_estimada or 0) - (d.tasa_diferencia or 0)
            neto = bruto - (d.tasa_estimada or 0) - (d.tasa_diferencia or 0)
            pct_salon = float(d.recaudacion.porcentaje_salon or 50) / 100.0
            val = float(neto) * pct_salon
            
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
            
            pct_salon = float(r.porcentaje_salon or 50) / 100.0
            val = float(r.total_global or 0) * pct_salon
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
            
            bruto = (d.retirada_efectivo or 0) + (d.cajon or 0) - (d.pago_manual or 0) + (d.ajuste or 0)
            neto = bruto - (d.tasa_estimada or 0) - (d.tasa_diferencia or 0)
            neto = bruto - (d.tasa_estimada or 0) - (d.tasa_diferencia or 0)
            pct_salon = float(d.recaudacion.porcentaje_salon or 50) / 100.0
            val = float(neto) * pct_salon
            data[salon_name] += val
    else:
        q = select(Recaudacion).options(selectinload(Recaudacion.salon))
        q = apply_common_filters(q, Recaudacion, salon_ids, years, months)
        
        result = await db.execute(q)
        recaudaciones = result.scalars().all()
        
        for r in recaudaciones:
            salon_name = r.salon.nombre if r.salon else f"Salon {r.salon_id}"
            pct_salon = float(r.porcentaje_salon or 50) / 100.0
            val = float(r.total_global or 0) * pct_salon
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
        bruto = (d.retirada_efectivo or 0) + (d.cajon or 0) - (d.pago_manual or 0) + (d.ajuste or 0)
        tasa = (d.tasa_estimada or 0) + (d.tasa_diferencia or 0)
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
        
        # SALON gets percentage_salon%
        pct_salon = float(d.recaudacion.porcentaje_salon or 50) / 100.0
        
        # Accumulate each component separately (proportional check - assuming taxes also split? Usually taxes are deducted first. 
        # The code previously split Bruto/Tasa/Neto ALL by 2. We will apply same ratio.)
        
        stats[full_name]["bruto"] += float(bruto) * pct_salon
        stats[full_name]["tasa"] += float(tasa) * pct_salon
        stats[full_name]["neto"] += float(neto) * pct_salon

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

@router.get("/comparative")
async def get_comparative_stats(
    db: AsyncSession = Depends(get_db),
    salon_ids: Optional[List[int]] = Query(None),
    years: Optional[List[int]] = Query(None),
    months: Optional[List[int]] = Query(None),
    machine_ids: Optional[List[int]] = Query(None),
    current_user: Usuario = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get comparative statistics per salon: revenue, net, and machine count.
    """
    from app.models.recaudacion import RecaudacionMaquina
    
    # 1. Get Revenue and Net per Salon
    # We use a similar logic to top-machines but grouped by Salon
    q = select(RecaudacionMaquina).join(Recaudacion).options(
        selectinload(RecaudacionMaquina.recaudacion).selectinload(Recaudacion.salon),
        selectinload(RecaudacionMaquina.maquina).selectinload(Maquina.puestos)
    )
    
    q = apply_common_filters(q, RecaudacionMaquina, salon_ids, years, months)
    
    if machine_ids:
        q = q.where(RecaudacionMaquina.maquina_id.in_(machine_ids))
        
    result = await db.execute(q)
    detalles = result.scalars().all()
    
    salon_stats = defaultdict(lambda: {"drop": 0.0, "pm": 0.0, "win": 0.0, "neto": 0.0, "tasas": 0.0, "depositos": 0.0, "otros_conceptos": 0.0, "machines": set(), "puestos": 0.0, "recaudacion_ids": set()})
    monthly_breakdown = defaultdict(lambda: defaultdict(float))
    monthly_depositos = defaultdict(lambda: defaultdict(float))
    monthly_otros = defaultdict(lambda: defaultdict(float))
    recaudacion_ids_processed = set()
    
    for d in detalles:
        if not d.recaudacion or not d.recaudacion.salon:
            continue
            
        salon_name = d.recaudacion.salon.nombre
        month = d.recaudacion.fecha_fin.month
        pct_salon = float(d.recaudacion.porcentaje_salon or 50) / 100.0
        
        # Machine-level metrics
        bruto = (d.retirada_efectivo or 0) + (d.cajon or 0) - (d.pago_manual or 0) + (d.ajuste or 0)
        
        val_drop = (float(d.retirada_efectivo or 0) + float(d.cajon or 0)) * pct_salon
        val_pm = float(d.pago_manual or 0) * pct_salon
        val_win = float(bruto) * pct_salon
        
        salon_stats[salon_name]["drop"] += val_drop
        salon_stats[salon_name]["pm"] += val_pm
        salon_stats[salon_name]["win"] += val_win
        salon_stats[salon_name]["win"] += val_win
        salon_stats[salon_name]["machines"].add(d.maquina_id)

        # Calculate Puestos for this entry (Machine-Period)
        n_puestos = 1
        if d.puesto_id:
             n_puestos = 1
        elif d.maquina and d.maquina.es_multipuesto:
             # If it's a multipuesto machine entry without specific puesto_id, it counts for all its positions?
             # Assuming RecaudacionMaquina entry for "Master" represents the whole machine if no puesto_id.
             # Use the count of active puestos defined in the machine.
             active_puestos = len([p for p in d.maquina.puestos if not p.eliminado and p.activo]) if d.maquina.puestos else 0
             # Fallback if no puestos defined but marked as multipuesto: query group or default to 1? 
             # Let's default to max(1, active_puestos)
             n_puestos = max(1, active_puestos)
        else:
             n_puestos = 1
        
        salon_stats[salon_name]["puestos"] += n_puestos
        salon_stats[salon_name]["recaudacion_ids"].add(d.recaudacion_id)

        # Handle Taxes and Neto:
        # If we are filtering by specific machines, we use machine-level taxes.
        # If we are NOT filtering (Salon view), we use Global taxes and Adjustments from cabecera.
        if machine_ids:
            tasa = (d.tasa_estimada or 0) + (d.tasa_diferencia or 0)
            val_tasas = float(tasa) * pct_salon
            val_neto = (float(bruto) - float(tasa)) * pct_salon
            
            salon_stats[salon_name]["tasas"] += val_tasas
            salon_stats[salon_name]["neto"] += val_neto
            monthly_breakdown[month][salon_name] += val_neto
        else:
            # Salon view: Add global concepts once per collection
            if d.recaudacion_id not in recaudacion_ids_processed:
                recaudacion_ids_processed.add(d.recaudacion_id)
                r = d.recaudacion
                
                # Global Taxes
                val_total_tasas = float(r.total_tasas or 0) * pct_salon
                # Deposits and Others
                val_depositos = float(r.depositos or 0) * pct_salon
                val_otros = float(r.otros_conceptos or 0) * pct_salon
                val_adj = val_depositos + val_otros
                
                salon_stats[salon_name]["depositos"] += val_depositos
                salon_stats[salon_name]["otros_conceptos"] += val_otros
                
                monthly_depositos[month][salon_name] += val_depositos
                monthly_otros[month][salon_name] += val_otros
                
                salon_stats[salon_name]["tasas"] += val_total_tasas
                # Neto = sum(win) - total_tasas + adj
                # Since 'neto' will be summed per machine val_win later, 
                # we initialize it with the global adjustments here (once per collection)
                # and then add each machine's val_win in every iteration.
                salon_stats[salon_name]["neto"] += val_adj - val_total_tasas
                monthly_breakdown[month][salon_name] += val_adj - val_total_tasas

            # Add machine's contribution to WIN (which is part of NETO before taxes/adjustments)
            salon_stats[salon_name]["neto"] += val_win
            monthly_breakdown[month][salon_name] += val_win
        
        if machine_ids:
            # For monthly breakdown in machine view, we already added val_neto above? No, let's fix it.
            # I'll move the monthly_breakdown update inside the if/else to be sure.
            pass

    # 2. Format result
    summary_data = []
    for name, stats in salon_stats.items():
        # machines_count = len(stats["machines"]) # Old logic: distinct machines
        total_accumulated_puestos = stats["puestos"] # Accumulated sum
        num_periods = len(stats["recaudacion_ids"]) # Distinct collections
        
        avg_puestos = total_accumulated_puestos / num_periods if num_periods > 0 else 0
        
        summary_data.append({
            "name": name,
            "drop": round(stats["drop"], 2),
            "pm": round(stats["pm"], 2),
            "win": round(stats["win"], 2),
            "neto": round(stats["neto"], 2),
            "tasas": round(stats["tasas"], 2),
            "depositos": round(stats["depositos"], 2),
            "otros_conceptos": round(stats["otros_conceptos"], 2),
            "machines": round(avg_puestos, 1), # Return Average Puestos count
            "avg_per_machine": round(stats["neto"] / avg_puestos, 2) if avg_puestos > 0 else 0
        })
    summary_data.sort(key=lambda x: x["win"], reverse=True)

    formatted_monthly = {}
    formatted_depositos = {}
    formatted_otros = {}
    
    for month in sorted(monthly_breakdown.keys()):
        m_str = str(month)
        
        # Neto/WIN
        month_list = [{"name": s_name, "value": round(s_rev, 2)} for s_name, s_rev in monthly_breakdown[month].items()]
        month_list.sort(key=lambda x: x["value"], reverse=True)
        formatted_monthly[m_str] = month_list
        
        # Depositos
        dep_list = [{"name": s_name, "value": round(s_val, 2)} for s_name, s_val in monthly_depositos[month].items()]
        dep_list.sort(key=lambda x: x["value"], reverse=True)
        formatted_depositos[m_str] = dep_list
        
        # Otros
        otr_list = [{"name": s_name, "value": round(s_val, 2)} for s_name, s_val in monthly_otros[month].items()]
        otr_list.sort(key=lambda x: x["value"], reverse=True)
        formatted_otros[m_str] = otr_list

    return {
        "summary": summary_data,
        "monthly": formatted_monthly,
        "monthly_depositos": formatted_depositos,
        "monthly_otros": formatted_otros
    }
