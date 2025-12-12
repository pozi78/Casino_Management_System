from typing import List, Optional
from datetime import date, datetime
from pydantic import BaseModel
from decimal import Decimal

# --- Recaudacion Maquina ---

from app.schemas.machine import Maquina, Puesto

# --- Recaudacion Maquina ---

class RecaudacionMaquinaBase(BaseModel):
    maquina_id: int
    puesto_id: Optional[int] = None
    retirada_efectivo: Decimal = Decimal(0)
    cajon: Decimal = Decimal(0)
    pago_manual: Decimal = Decimal(0)
    tasa_ajuste: Decimal = Decimal(0)
    detalle_tasa: Optional[str] = None
    tasa_calculada: Optional[Decimal] = Decimal(0)
    tasa_final: Optional[Decimal] = Decimal(0)

class RecaudacionMaquinaCreate(RecaudacionMaquinaBase):
    pass

class RecaudacionMaquinaUpdate(BaseModel):
    # Only fields that can be manually edited
    retirada_efectivo: Optional[Decimal] = None
    cajon: Optional[Decimal] = None
    pago_manual: Optional[Decimal] = None
    tasa_ajuste: Optional[Decimal] = None
    detalle_tasa: Optional[str] = None

class RecaudacionMaquina(RecaudacionMaquinaBase):
    id: int
    recaudacion_id: int
    maquina: Optional[Maquina] = None # Include Maquina info
    puesto: Optional[Puesto] = None

    class Config:
        from_attributes = True

# --- Recaudacion ---

class RecaudacionBase(BaseModel):
    salon_id: int
    fecha_inicio: datetime
    fecha_fin: datetime
    fecha_cierre: date
    etiqueta: Optional[str] = None
    origen: Optional[str] = 'manual'
    referencia_fichero: Optional[str] = None
    notas: Optional[str] = None
    total_tasas: Optional[Decimal] = Decimal(0)
    depositos: Optional[Decimal] = Decimal(0)
    otros_conceptos: Optional[Decimal] = Decimal(0)
    bloqueada: Optional[bool] = False

class RecaudacionCreate(RecaudacionBase):
    pass

class RecaudacionUpdate(BaseModel):
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    fecha_cierre: Optional[date] = None
    etiqueta: Optional[str] = None
    notas: Optional[str] = None
    total_tasas: Optional[Decimal] = None
    depositos: Optional[Decimal] = None
    otros_conceptos: Optional[Decimal] = None
    bloqueada: Optional[bool] = None

class RecaudacionSummary(RecaudacionBase):
    id: int
    total_neto: Optional[Decimal] = None
    total_global: Optional[Decimal] = None

    class Config:
        from_attributes = True

from app.schemas.salon import Salon # Import Salon schema

# ... (omitted)

class RecaudacionFichero(BaseModel):
    id: int
    recaudacion_id: int
    filename: str
    content_type: Optional[str]
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Recaudacion(RecaudacionBase):
    id: int
    detalles: List[RecaudacionMaquina] = []
    ficheros: List[RecaudacionFichero] = []
    salon: Optional[Salon] = None

    class Config:
        from_attributes = True

# For Bulk Updates if needed
class RecaudacionMaquinaBulkUpdate(BaseModel):
    maquina_id: int
    retirada_efectivo: Optional[Decimal]
    cajon: Optional[Decimal]
    pago_manual: Optional[Decimal]
    tasa_ajuste: Optional[Decimal]
