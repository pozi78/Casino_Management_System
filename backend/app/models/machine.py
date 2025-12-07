from sqlalchemy import Column, Integer, String, Boolean, Numeric, Date, ForeignKey, func, Text
from sqlalchemy.orm import relationship, backref
from app.db.base_class import Base

class GrupoMaquina(Base):
    __tablename__ = "grupo_maquina"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False, index=True)
    cantidad_puestos = Column(Integer, default=1)
    descripcion = Column(String, nullable=True)

    maquinas = relationship("Maquina", back_populates="grupo")

class TipoMaquina(Base):
    __tablename__ = "tipo_maquina"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    tasa_semanal_orientativa = Column(Numeric(10, 2), nullable=False) # Renamed from tasa_semanal_base
    tasa_por_puesto = Column(Boolean, default=False)
    es_multipuesto = Column(Boolean, default=False)
    descripcion = Column(String, nullable=True)
    activo = Column(Boolean, default=True)

    maquinas = relationship("Maquina", back_populates="tipo_maquina")

class Maquina(Base):
    __tablename__ = "maquina"
    id = Column(Integer, primary_key=True, index=True)
    
    # Relationships
    salon_id = Column(Integer, ForeignKey("salon.id"), nullable=False)
    tipo_maquina_id = Column(Integer, ForeignKey("tipo_maquina.id"), nullable=False)
    grupo_id = Column(Integer, ForeignKey("grupo_maquina.id"), nullable=True)
    
    # Identification
    nombre = Column(String, nullable=False) # Obligatorio
    nombre_referencia_uorsa = Column(String, nullable=True) # Opcional
    numero_serie = Column(String, nullable=True)
    
    # Config
    es_multipuesto = Column(Boolean, default=False)
    numero_puesto = Column(Integer, nullable=True)
    tasa_semanal_override = Column(Numeric(10, 2), nullable=True)
    
    # Status
    activo = Column(Boolean, default=True, nullable=False)
    observaciones = Column(Text, nullable=True)
    fecha_alta = Column(Date, default=func.current_date(), nullable=False)
    fecha_baja = Column(Date, nullable=True)

    # Legacy/Deprecated but keeping for data safety until migration verified
    maquina_padre_id = Column(Integer, ForeignKey("maquina.id"), nullable=True)

    # Relationships
    salon = relationship("Salon", back_populates="maquinas")
    tipo_maquina = relationship("TipoMaquina", back_populates="maquinas")
    grupo = relationship("GrupoMaquina", back_populates="maquinas")
    
    # Self-referential relationship for multipuesto/roulette (Legacy support)
    submaquinas = relationship("Maquina", 
                             backref=backref("maquina_padre", remote_side=[id]),
                             cascade="all, delete-orphan")

    usuarios_asignados = relationship("UsuarioMaquina", back_populates="maquina")
    recaudaciones_maquina = relationship("RecaudacionMaquina", back_populates="maquina")
