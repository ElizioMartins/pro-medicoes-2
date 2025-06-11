from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from .database import Base
import enum

class ReadingStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    INACCESSIBLE = "INACCESSIBLE"

class ReadingPhoto(Base):
    __tablename__ = "reading_photos"

    id = Column(Integer, primary_key=True, index=True)
    reading_id = Column(Integer, ForeignKey("readings.id", ondelete="CASCADE"))
    full_photo_url = Column(String)
    cropped_photo_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relacionamento
    reading = relationship("Reading", back_populates="photos")

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

class ReadingPhotoBase(BaseModel):
    full_photo_url: str
    cropped_photo_url: Optional[str] = None
    
class ReadingPhotoCreate(ReadingPhotoBase):
    pass

class ReadingPhotoResponse(ReadingPhotoBase):
    id: int
    reading_id: int

    class Config:
        orm_mode = True

class ReadingBase(BaseModel):
    meter_id: int
    current_reading: str
    status: ReadingStatus
    inaccessible_reason: Optional[str] = None
    observations: Optional[str] = None

class ReadingCreate(ReadingBase):
    photos: Optional[List[ReadingPhotoCreate]] = None

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
    photos: List[ReadingPhotoResponse] = []
    meter: dict  # Incluirá informações básicas do medidor

    class Config:
        orm_mode = True
