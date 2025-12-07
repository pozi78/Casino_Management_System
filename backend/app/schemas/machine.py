from typing import Optional, List
from datetime import date
from pydantic import BaseModel
from decimal import Decimal

# --- Grupo Maquina Schemas ---

class GrupoMaquinaBase(BaseModel):
    nombre: Optional[str] = None
    cantidad_puestos: Optional[int] = 1
    descripcion: Optional[str] = None

class GrupoMaquinaCreate(GrupoMaquinaBase):
    nombre: str

class GrupoMaquinaUpdate(GrupoMaquinaBase):
    pass

class GrupoMaquina(GrupoMaquinaBase):
    id: int
    
    class Config:
        from_attributes = True

# --- Tipo Maquina Schemas ---

class TipoMaquinaBase(BaseModel):
    nombre: Optional[str] = None
    tasa_semanal_orientativa: Optional[Decimal] = None
    tasa_por_puesto: Optional[bool] = False
    es_multipuesto: Optional[bool] = False
    descripcion: Optional[str] = None
    activo: Optional[bool] = True

class TipoMaquinaCreate(TipoMaquinaBase):
    nombre: str
    tasa_semanal_orientativa: Decimal

class TipoMaquinaUpdate(TipoMaquinaBase):
    pass

class TipoMaquina(TipoMaquinaBase):
    id: int

    class Config:
        from_attributes = True

# --- Maquina Schemas ---

class MaquinaBase(BaseModel):
    salon_id: Optional[int] = None
    tipo_maquina_id: Optional[int] = None
    grupo_id: Optional[int] = None
    
    nombre: Optional[str] = None
    nombre_referencia_uorsa: Optional[str] = None
    numero_serie: Optional[str] = None
    
    es_multipuesto: Optional[bool] = False
    numero_puesto: Optional[int] = None
    maquina_padre_id: Optional[int] = None
    tasa_semanal_override: Optional[Decimal] = None
    
    activo: Optional[bool] = True
    observaciones: Optional[str] = None
    fecha_alta: Optional[date] = None
    fecha_baja: Optional[date] = None

class MaquinaCreate(MaquinaBase):
    salon_id: int
    tipo_maquina_id: int
    nombre: str 

class MaquinaUpdate(MaquinaBase):
    pass

class Maquina(MaquinaBase):
    id: int
    
    # We can include nested objects if needed, e.g.
    # tipo: TipoMaquina
    # grupo: Optional[GrupoMaquina]
    
    class Config:
        from_attributes = True
