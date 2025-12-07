from typing import Optional, List
from datetime import date
from pydantic import BaseModel
from decimal import Decimal

# --- Tipo Maquina Schemas ---

class TipoMaquinaBase(BaseModel):
    nombre: Optional[str] = None
    tasa_semanal_base: Optional[Decimal] = None
    tasa_por_puesto: Optional[bool] = False
    descripcion: Optional[str] = None
    activo: Optional[bool] = True

class TipoMaquinaCreate(TipoMaquinaBase):
    nombre: str
    tasa_semanal_base: Decimal

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
    numero_serie: Optional[str] = None
    maquina_padre_id: Optional[int] = None
    numero_puesto: Optional[int] = None
    tasa_semanal_override: Optional[Decimal] = None
    activo: Optional[bool] = True
    fecha_alta: Optional[date] = None
    fecha_baja: Optional[date] = None

class MaquinaCreate(MaquinaBase):
    salon_id: int
    tipo_maquina_id: int

class MaquinaUpdate(MaquinaBase):
    pass

class Maquina(MaquinaBase):
    id: int
    
    # Nested relationships can be added here if needed for list views
    # but initially we keep it simple to avoid circular deps or heavy queries
    
    class Config:
        from_attributes = True
