from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from .database import Base

class ReadingPhoto(Base):
    __tablename__ = "reading_photos"

    id = Column(Integer, primary_key=True, index=True)
    reading_id = Column(Integer, ForeignKey("readings.id", ondelete="CASCADE"))
    file_path = Column(String)  # Path to the full image
    cropped_file_path = Column(String, nullable=True)  # Path to the cropped image
    is_cropped = Column(Boolean, default=False)
    timestamp = Column(DateTime, nullable=True)  # Timestamp of when the photo was taken
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relacionamento
    reading = relationship("Reading", back_populates="photos")

# Modelos Pydantic para validação de dados
class ReadingPhotoBase(BaseModel):
    file_path: str
    cropped_file_path: Optional[str] = None
    is_cropped: Optional[bool] = False
    timestamp: Optional[datetime] = None

class ReadingPhotoCreate(ReadingPhotoBase):
    reading_id: int

class ReadingPhotoUpdate(BaseModel):
    file_path: Optional[str] = None
    cropped_file_path: Optional[str] = None
    is_cropped: Optional[bool] = None
    timestamp: Optional[datetime] = None

class ReadingPhotoResponse(ReadingPhotoBase):
    id: int
    reading_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
