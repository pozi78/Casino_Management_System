from sqlalchemy import Column, Integer, String, Boolean, Numeric, Date, ForeignKey, func, Text, UniqueConstraint
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
    nombre = Column(String, nullable=False) # Nombre de la máquina (Ej: "Ruleta Hall")
    nombre_referencia_uorsa = Column(String, nullable=True)
    numero_serie = Column(String, nullable=True)
    
    # Config
    es_multipuesto = Column(Boolean, default=False)
    tasa_semanal_override = Column(Numeric(10, 2), nullable=True)
    
    # Status
    activo = Column(Boolean, default=True, nullable=False)
    eliminada = Column(Boolean, default=False, nullable=False) # Soft delete
    observaciones = Column(Text, nullable=True)
    fecha_alta = Column(Date, default=func.current_date(), nullable=False)
    fecha_baja = Column(Date, nullable=True)

    # Relationships
    salon = relationship("Salon", back_populates="maquinas")
    tipo_maquina = relationship("TipoMaquina", back_populates="maquinas")
    grupo = relationship("GrupoMaquina", back_populates="maquinas")
    
    puestos = relationship("Puesto", back_populates="maquina", cascade="all, delete-orphan")
    
    # Legacy relationships - updated to match Puesto if needed, or kept on Maquina?
    # User said "recaudaciones, etc...". Recaudacion connects to what?
    # Usually money comes from Puestos in a multipuesto machine.
    # But for now, let's allow linking to Maquina to not break everything 
    # OR we must shift RecaudacionMaquina to link to Puesto.
    # The user instruction implies a big change ("Revisa el codigo y cambia lo que sea necesario").
    # If I keep Recaudacion linked to Maquina, I can't differentiate which Puesto generated the money in a Roulette.
    # I will add relationship to Puesto, but maybe keep this one for backward compat (though we are deleting DB)?
    # Let's clean it up. Linking to Maquina (physical) is still valid for machine-level events.
    usuarios_asignados = relationship("UsuarioMaquina", back_populates="maquina")

    # Important: Recaudacion might technically belong to Puesto now, but `RecaudacionMaquina` table name implies Maquina.
    # I will leave Recaudacion linked to Maquina for now to reduce scope explosion, 
    # UNLESS the user explicitly asked to change Recaudacion logic. They didn't.
    recaudaciones_maquina = relationship("RecaudacionMaquina", back_populates="maquina")


class Puesto(Base):
    __tablename__ = "puesto"
    id = Column(Integer, primary_key=True, index=True)
    maquina_id = Column(Integer, ForeignKey("maquina.id"), nullable=False)
    
    numero_puesto = Column(Integer, nullable=False) # 1, 2, 3...
    descripcion = Column(String, nullable=True) # "Asiento 1"
    tasa_semanal = Column(Numeric(10, 2), default=0)
    
    activo = Column(Boolean, default=True)
    eliminado = Column(Boolean, default=False) # Soft delete
    
    maquina = relationship("Maquina", back_populates="puestos")

class MaquinaExcelMap(Base):
    __tablename__ = "maquina_excel_map"
    id = Column(Integer, primary_key=True, index=True)
    salon_id = Column(Integer, ForeignKey("salon.id"), nullable=False)
    excel_nombre = Column(String, nullable=False)
    
    maquina_id = Column(Integer, ForeignKey("maquina.id"), nullable=True)
    puesto_id = Column(Integer, ForeignKey("puesto.id"), nullable=True)
    is_ignored = Column(Boolean, default=False)

    __table_args__ = (
        UniqueConstraint('salon_id', 'excel_nombre', name='uq_excel_map_salon_nombre'),
    )
