from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from .database import Base

# SQLAlchemy Model
class Unit(Base):
    __tablename__ = "units"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    condominium_id = Column(Integer, ForeignKey("condominiums.id", ondelete="CASCADE"))
    number = Column(String, index=True)  # Número da unidade (ex: 101, 102, etc.)
    owner = Column(String)
    meters_count = Column(Integer, default=0)
    last_reading = Column(DateTime, nullable=True)
    observations = Column(String, nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos
    condominium = relationship("Condominium", back_populates="units")
    meters = relationship("Meter", back_populates="unit", cascade="all, delete-orphan")
    
# Pydantic Models
class UnitBase(BaseModel):
    number: str
    owner: str
    meters_count: int = 0
    last_reading: Optional[datetime] = None
    active: bool = True
    observations: Optional[str] = None

class UnitCreate(UnitBase):
    pass

class UnitUpdate(BaseModel):
    number: Optional[str] = None
    owner: Optional[str] = None
    active: Optional[bool] = None
    observations: Optional[str] = None

class UnitResponse(UnitBase):
    id: int
    condominium_id: int
    created_at: datetime
    updated_at: datetime    
    class Config:
        orm_mode = True
