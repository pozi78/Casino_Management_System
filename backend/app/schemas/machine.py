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

# --- Puesto Schemas ---

class PuestoBase(BaseModel):
    numero_puesto: int
    descripcion: Optional[str] = None
    tasa_semanal: Optional[Decimal] = 0
    activo: Optional[bool] = True
    eliminado: Optional[bool] = False

class PuestoCreate(PuestoBase):
    maquina_id: int

class PuestoUpdate(PuestoBase):
    pass

class Puesto(PuestoBase):
    id: int
    maquina_id: int
    
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
    tasa_semanal_override: Optional[Decimal] = None
    
    activo: Optional[bool] = True
    eliminada: Optional[bool] = False
    observaciones: Optional[str] = None
    fecha_alta: Optional[date] = None
    fecha_baja: Optional[date] = None

class MaquinaCreate(MaquinaBase):
    salon_id: int
    tipo_maquina_id: int
    nombre: str
    
    # Optional: allow specifying number of seats to auto-create
    cantidad_puestos_iniciales: Optional[int] = 1

class MaquinaUpdate(MaquinaBase):
    pass

class Maquina(MaquinaBase):
    id: int
    
    puestos: List[Puesto] = []
    
    class Config:
        from_attributes = True
