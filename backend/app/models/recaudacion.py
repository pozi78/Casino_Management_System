from sqlalchemy import Column, Integer, String, Date, ForeignKey, Numeric, UniqueConstraint, DateTime
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Recaudacion(Base):
    __tablename__ = "recaudacion"
    id = Column(Integer, primary_key=True, index=True)
    salon_id = Column(Integer, ForeignKey("salon.id"), nullable=False)
    fecha_inicio = Column(DateTime, nullable=False)
    fecha_fin = Column(DateTime, nullable=False)
    fecha_cierre = Column(Date, nullable=False)
    etiqueta = Column(String)
    origen = Column(String) # manual, importacion
    referencia_fichero = Column(String)
    notas = Column(String)

    # Global Editable Fields
    total_tasas = Column(Numeric(12, 2), default=0)
    depositos = Column(Numeric(12, 2), default=0)
    otros_conceptos = Column(Numeric(12, 2), default=0)

    salon = relationship("Salon", back_populates="recaudaciones")
    detalles = relationship("RecaudacionMaquina", back_populates="recaudacion", cascade="all, delete-orphan")

    @property
    def total_bruto(self):
        if not self.detalles:
            return 0
        return sum(
            (d.retirada_efectivo or 0) + (d.cajon or 0) - (d.pago_manual or 0) + (d.tasa_ajuste or 0)
            for d in self.detalles
        )

    @property
    def total_neto(self):
        return self.total_bruto - sum((d.tasa_calculada or 0) for d in (self.detalles or []))

    @property
    def total_global(self):
        # Matches 'Total Final' in Frontend Detail View:
        # Subtotal (Bruto - Global Taxes) + Deposits + Other Concepts
        bruto = self.total_bruto
        taxes = self.total_tasas or 0
        deps = self.depositos or 0
        others = self.otros_conceptos or 0
        return bruto - taxes + deps + others

class RecaudacionMaquina(Base):
    __tablename__ = "recaudacion_maquina"
    id = Column(Integer, primary_key=True, index=True)
    recaudacion_id = Column(Integer, ForeignKey("recaudacion.id"), nullable=False)
    maquina_id = Column(Integer, ForeignKey("maquina.id"), nullable=False)
    puesto_id = Column(Integer, ForeignKey("puesto.id"), nullable=True)

    retirada_efectivo = Column(Numeric(12, 2), default=0)
    cajon = Column(Numeric(12, 2), default=0)
    pago_manual = Column(Numeric(12, 2), default=0)

    tasa_calculada = Column(Numeric(12, 2), default=0)
    tasa_ajuste = Column(Numeric(12, 2), default=0)
    tasa_final = Column(Numeric(12, 2), default=0)

    detalle_tasa = Column(String)

    recaudacion = relationship("Recaudacion", back_populates="detalles")
    maquina = relationship("Maquina", back_populates="recaudaciones_maquina")
    puesto = relationship("Puesto")

    __table_args__ = (
        UniqueConstraint('recaudacion_id', 'puesto_id', name='uq_recaudacion_puesto'),
    )

class TipoConceptoExtra(Base):
    __tablename__ = "tipo_concepto_extra"
    id = Column(Integer, primary_key=True)
    codigo = Column(String, unique=True)
    descripcion = Column(String)
    signo_por_defecto = Column(Integer, default=1) # 1 or -1

class RecaudacionConceptoExtra(Base):
    __tablename__ = "recaudacion_concepto_extra"
    id = Column(Integer, primary_key=True)
    recaudacion_id = Column(Integer, ForeignKey("recaudacion.id"))
    maquina_id = Column(Integer, ForeignKey("maquina.id"), nullable=True) # Can be null if global to recaudacion? Prompt implies per machine usually but let's stick to prompt `maquina_id`
    tipo_concepto_extra_id = Column(Integer, ForeignKey("tipo_concepto_extra.id"))
    descripcion = Column(String)
    importe = Column(Numeric(12, 2))
