from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from .database import Base
from .reading_photos import ReadingPhoto, ReadingPhotoResponse  # Certifique-se de que o caminho está correto
import enum

class ReadingStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    INACCESSIBLE = "INACCESSIBLE"



class Reading(Base):
    __tablename__ = "readings"

    id = Column(Integer, primary_key=True, index=True)
    meter_id = Column(Integer, ForeignKey("meters.id", ondelete="CASCADE"))
    current_reading = Column(String)  # Valor lido do medidor
    date = Column(DateTime, default=datetime.utcnow)
    reference_month = Column(String, nullable=False)  # Mês de referência no formato YYYY-MM
    registered_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    status = Column(Enum(ReadingStatus), default=ReadingStatus.PENDING)
    inaccessible_reason = Column(String, nullable=True)
    observations = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relacionamentos
    meter = relationship("Meter", back_populates="readings")
    photos = relationship("ReadingPhoto", back_populates="reading", cascade="all, delete-orphan")


class ReadingBase(BaseModel):
    meter_id: int
    current_reading: str
    reference_month: str  # Formato YYYY-MM
    status: ReadingStatus
    inaccessible_reason: Optional[str] = None
    observations: Optional[str] = None

class ReadingCreate(ReadingBase):
    class Config:
        arbitrary_types_allowed = True  # Permite tipos arbitrários
    
    photos: Optional[List[ReadingPhotoResponse]] = None

class ReadingUpdate(BaseModel):
    current_reading: Optional[str] = None
    reference_month: Optional[str] = None  # Formato YYYY-MM
    status: Optional[ReadingStatus] = None
    inaccessible_reason: Optional[str] = None
    observations: Optional[str] = None

class ReadingResponse(ReadingBase):
    id: int
    date: datetime
    reference_month: str  # Mês de referência no formato YYYY-MM
    created_at: datetime
    updated_at: datetime
    photos: List[ReadingPhotoResponse] = []
    
    # Importar aqui para evitar import circular
    class MeterInfo(BaseModel):
        id: int
        serial_number: Optional[str] = None
        unit_id: int
        measurement_type_id: int
        
        class UnitInfo(BaseModel):
            id: int
            number: str
            condominium_id: int
            
            class CondominiumInfo(BaseModel):
                id: int
                name: str
                
                class Config:
                    orm_mode = True
            
            condominium: Optional[CondominiumInfo] = None
            
            class Config:
                orm_mode = True
        
        class MeasurementTypeInfo(BaseModel):
            id: int
            name: str
            unit: str
            
            class Config:
                orm_mode = True
        
        unit: Optional[UnitInfo] = None
        measurement_type: Optional[MeasurementTypeInfo] = None
        
        class Config:
            orm_mode = True
    
    meter: Optional[MeterInfo] = None

    class Config:
        orm_mode = True
        arbitrary_types_allowed = True
