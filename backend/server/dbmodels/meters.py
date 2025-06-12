from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from .database import Base
from .measurement_types import MeasurementTypeResponse

class Meter(Base):
    __tablename__ = "meters"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id", ondelete="CASCADE"))
    measurement_type_id = Column(Integer, ForeignKey("measurement_types.id"))
    serial_number = Column(String, index=True, nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_reading_date = Column(DateTime, nullable=True)

    # Relacionamentos
    unit = relationship("Unit", back_populates="meters")
    measurement_type = relationship("MeasurementType", backref="meters")
    readings = relationship("Reading", back_populates="meter", cascade="all, delete-orphan")

# Pydantic Models
class MeterBase(BaseModel):
    unit_id: int
    measurement_type_id: int
    serial_number: Optional[str] = None
    active: bool = True
    last_reading_date: Optional[datetime] = None

class MeterCreate(MeterBase):
    pass

class MeterUpdate(BaseModel):
    serial_number: Optional[str] = None
    active: Optional[bool] = None

class MeterResponse(MeterBase):
    id: int
    created_at: datetime
    updated_at: datetime
    measurement_type: Optional[MeasurementTypeResponse] = None

    class Config:
        orm_mode = True
