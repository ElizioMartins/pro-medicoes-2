from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from .database import Base

class MeasurementType(Base):
    __tablename__ = "measurement_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    unit = Column(String)  # Unidade de medida (m³, kWh, etc.)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Modelos Pydantic para validação de dados
class MeasurementTypeBase(BaseModel):
    name: str
    unit: str
    active: bool = True

class MeasurementTypeCreate(MeasurementTypeBase):
    pass

class MeasurementTypeUpdate(BaseModel):
    name: Optional[str] = None
    unit: Optional[str] = None
    active: Optional[bool] = None

class MeasurementTypeResponse(MeasurementTypeBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
