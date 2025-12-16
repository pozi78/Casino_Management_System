from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.db.base_class import Base

# Association Tables
rol_permiso = Table(
    "rol_permiso",
    Base.metadata,
    Column("rol_id", Integer, ForeignKey("rol.id"), primary_key=True),
    Column("permiso_id", Integer, ForeignKey("permiso.id"), primary_key=True),
)

usuario_rol = Table(
    "usuario_rol",
    Base.metadata,
    Column("usuario_id", Integer, ForeignKey("usuario.id"), primary_key=True),
    Column("rol_id", Integer, ForeignKey("rol.id"), primary_key=True),
)

class Permiso(Base):
    __tablename__ = "permiso"
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, unique=True, index=True)
    descripcion = Column(String)

class Rol(Base):
    __tablename__ = "rol"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String)
    codigo = Column(String, unique=True, index=True)
    
    permisos = relationship("Permiso", secondary=rol_permiso, backref="roles")

class Usuario(Base):
    __tablename__ = "usuario"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hash_password = Column(String, nullable=False)
    activo = Column(Boolean, default=True)

    # Mandatory fields
    telefono = Column(String)
    telegram_user = Column(String)
    cargo = Column(String)
    departamento = Column(String)
    codigo_empleado = Column(String)

    # Optional fields
    dni = Column(String, nullable=True)
    direccion_postal = Column(String, nullable=True)
    notas = Column(String, nullable=True)
    ultimo_acceso = Column(String, nullable=True) # Using String for simplicity/datetime sync, or could use DateTime

    roles = relationship("Rol", secondary=usuario_rol, backref="usuarios")
    
    # Scoped permissions associations
    salones_asignados = relationship("UsuarioSalon", back_populates="usuario")
    maquinas_asignadas = relationship("UsuarioMaquina", back_populates="usuario")

class UsuarioSalon(Base):
    __tablename__ = "usuario_salon"
    usuario_id = Column(Integer, ForeignKey("usuario.id"), primary_key=True)
    salon_id = Column(Integer, ForeignKey("salon.id"), primary_key=True)
    puede_ver = Column(Boolean, default=True)
    puede_editar = Column(Boolean, default=False)
    
    # New Granular Permissions
    ver_dashboard = Column(Boolean, default=False)
    ver_recaudaciones = Column(Boolean, default=False)
    editar_recaudaciones = Column(Boolean, default=False)
    ver_historico = Column(Boolean, default=False)

    usuario = relationship("Usuario", back_populates="salones_asignados")
    salon = relationship("Salon", back_populates="usuarios_asignados")

class UsuarioMaquina(Base):
    __tablename__ = "usuario_maquina"
    usuario_id = Column(Integer, ForeignKey("usuario.id"), primary_key=True)
    maquina_id = Column(Integer, ForeignKey("maquina.id"), primary_key=True)
    puede_ver = Column(Boolean, default=True)
    puede_editar = Column(Boolean, default=False)

    usuario = relationship("Usuario", back_populates="maquinas_asignadas")
    maquina = relationship("Maquina", back_populates="usuarios_asignados")
