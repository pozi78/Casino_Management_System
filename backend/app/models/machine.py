from sqlalchemy import Column, Integer, String, Boolean, Numeric, Date, ForeignKey, func
from sqlalchemy.orm import relationship, backref
from app.db.base_class import Base

class TipoMaquina(Base):
    __tablename__ = "tipo_maquina"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    tasa_semanal_base = Column(Numeric(10, 2), nullable=False)
    tasa_por_puesto = Column(Boolean, default=False)
    descripcion = Column(String)
    activo = Column(Boolean, default=True)

    maquinas = relationship("Maquina", back_populates="tipo_maquina")

class Maquina(Base):
    __tablename__ = "maquina"
    id = Column(Integer, primary_key=True, index=True)
    salon_id = Column(Integer, ForeignKey("salon.id"), nullable=False)
    tipo_maquina_id = Column(Integer, ForeignKey("tipo_maquina.id"), nullable=False)
    numero_serie = Column(String)
    maquina_padre_id = Column(Integer, ForeignKey("maquina.id"), nullable=True)
    numero_puesto = Column(Integer, nullable=True)
    tasa_semanal_override = Column(Numeric(10, 2), nullable=True)
    activo = Column(Boolean, default=True, nullable=False)
    fecha_alta = Column(Date, default=func.current_date(), nullable=False)
    fecha_baja = Column(Date, nullable=True)

    salon = relationship("Salon", back_populates="maquinas")
    tipo_maquina = relationship("TipoMaquina", back_populates="maquinas")
    
    # Self-referential relationship for multipuesto/roulette
    submaquinas = relationship("Maquina", 
                             backref=backref("maquina_padre", remote_side=[id]),
                             cascade="all, delete-orphan")

    usuarios_asignados = relationship("UsuarioMaquina", back_populates="maquina")
    recaudaciones_maquina = relationship("RecaudacionMaquina", back_populates="maquina")
