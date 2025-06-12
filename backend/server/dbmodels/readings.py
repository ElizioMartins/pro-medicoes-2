from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from .database import Base
from .reading_photos import ReadingPhoto  # Certifique-se de que o caminho está correto
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
    status: ReadingStatus
    inaccessible_reason: Optional[str] = None
    observations: Optional[str] = None

class ReadingCreate(ReadingBase):
    photos: Optional[List[ReadingPhoto]] = None

class ReadingUpdate(BaseModel):
    current_reading: Optional[str] = None
    status: Optional[ReadingStatus] = None
    inaccessible_reason: Optional[str] = None
    observations: Optional[str] = None

class ReadingResponse(ReadingBase):
    id: int
    date: datetime
    created_at: datetime
    updated_at: datetime
    photos: List[ReadingPhoto] = []
    meter: dict  # Incluirá informações básicas do medidor

    class Config:
        orm_mode = True
