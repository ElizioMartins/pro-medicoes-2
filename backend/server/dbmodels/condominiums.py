from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from .database import Base

# SQLAlchemy Model
class Condominium(Base):
    __tablename__ = "condominiums"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    address = Column(String)
    cnpj = Column(String, unique=True, index=True)
    manager = Column(String)
    phone = Column(String)
    email = Column(String)
    units_count = Column(Integer, default=0)
    meters_count = Column(Integer, default=0)
    readings_count = Column(Integer, default=0)
    reports_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship with units
    units = relationship("Unit", back_populates="condominium", cascade="all, delete-orphan")

# Pydantic Model
class CondominiumBase(BaseModel):
    name: str
    address: str
    cnpj: str
    manager: str
    phone: str
    email: EmailStr

class CondominiumCreate(CondominiumBase):
    pass

class CondominiumUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    cnpj: Optional[str] = None
    manager: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None

class CondominiumResponse(CondominiumBase):
    id: int
    units_count: int = 0
    meters_count: int = 0
    readings_count: int = 0
    reports_count: int = 0
    created_at: datetime
    updated_at: datetime    
    
    class Config:
        orm_mode = True




