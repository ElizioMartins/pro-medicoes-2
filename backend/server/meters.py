from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Meter(Base):
    __tablename__ = "meters"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"))
    measurement_type_id = Column(Integer, ForeignKey("measurement_types.id"))
    serial_number = Column(String, index=True, nullable=True)
    # Adicionar outros campos relevantes conforme necessário

    # Relacionamentos
    unit = relationship("Unit", back_populates="meters")
    measurement_type = relationship("MeasurementType")
    readings = relationship("Reading", back_populates="meter")
