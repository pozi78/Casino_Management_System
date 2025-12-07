from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Salon(Base):
    __tablename__ = "salon"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    direccion = Column(String)
    activo = Column(Boolean, default=True)
    creado_en = Column(DateTime, default=func.now())
    actualizado_en = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    maquinas = relationship("Maquina", back_populates="salon")
    recaudaciones = relationship("Recaudacion", back_populates="salon")
    usuarios_asignados = relationship("UsuarioSalon", back_populates="salon")
