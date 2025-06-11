from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Meter(Base):
    __tablename__ = "meters"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id", ondelete="CASCADE"))
    measurement_type_id = Column(Integer, ForeignKey("measurement_types.id"))
    serial_number = Column(String, index=True, nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_reading_date = Column(DateTime, nullable=True)

    # Relacionamentos
    unit = relationship("Unit", back_populates="meters", cascade="all")
    measurement_type = relationship("MeasurementType")
    readings = relationship("Reading", back_populates="meter", cascade="all, delete-orphan")
