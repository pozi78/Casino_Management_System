from typing import Optional
from pydantic import BaseModel

# Shared properties
class RoleBase(BaseModel):
    nombre: Optional[str] = None
    codigo: Optional[str] = None

# Properties to receive via API on creation
class RoleCreate(RoleBase):
    nombre: str
    codigo: str

# Properties to receive via API on update
class RoleUpdate(RoleBase):
    pass

class RoleInDBBase(RoleBase):
    id: Optional[int] = None

    class Config:
        from_attributes = True

# Additional properties to return via API
class Role(RoleInDBBase):
    pass

# Additional properties stored in DB
class RoleInDB(RoleInDBBase):
    pass
