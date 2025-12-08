from typing import Optional, List
from pydantic import BaseModel, EmailStr

# Shared properties
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    activo: Optional[bool] = True
    nombre: Optional[str] = None

# Properties to receive via API on creation
class UserCreate(UserBase):
    email: EmailStr
    username: str
    password: str

# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = None

class UserInDBBase(UserBase):
    id: Optional[int] = None

    class Config:
        from_attributes = True

from .salon import Salon

# Additional properties to return via API
class UsuarioSalon(BaseModel):
    salon_id: int
    puede_ver: bool
    puede_editar: bool
    salon: Optional[Salon] = None

    class Config:
        from_attributes = True

class User(UserInDBBase):
    salones_asignados: List[UsuarioSalon] = []

# Additional properties stored in DB
class UserInDB(UserInDBBase):
    hash_password: str
