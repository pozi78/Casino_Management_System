from typing import Optional
from datetime import datetime
from pydantic import BaseModel

# Shared properties
class SalonBase(BaseModel):
    nombre: Optional[str] = None
    direccion: Optional[str] = None
    activo: Optional[bool] = True

# Properties to receive via API on creation
class SalonCreate(SalonBase):
    nombre: str

# Properties to receive via API on update
class SalonUpdate(SalonBase):
    pass

# Properties shared by models stored in DB
class SalonInDBBase(SalonBase):
    id: int
    creado_en: datetime
    actualizado_en: datetime

    class Config:
        from_attributes = True

# Properties to return to client
class Salon(SalonInDBBase):
    pass

# Properties stored in DB
class SalonInDB(SalonInDBBase):
    pass
