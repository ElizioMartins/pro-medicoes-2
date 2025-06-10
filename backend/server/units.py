from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, relationship
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from database import Base, get_db
from datetime import datetime
from typing import List
from pydantic import BaseModel

# SQLAlchemy Model
class Unit(Base):
    __tablename__ = "units"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    identifier = Column(String, index=True)
    owner = Column(String)
    condominium_id = Column(Integer, ForeignKey("condominiums.id"))
    meters_count = Column(Integer, default=0)
    last_reading = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relacionamento com Condominium (já existente)
    condominium = relationship("Condominium", back_populates="units")

    # Novo relacionamento com Meters
    meters = relationship("Meter", back_populates="unit")

# Pydantic Models
class UnitBase(BaseModel):
    identifier: str
    owner: str
    meters_count: int = 0
    last_reading: datetime | None = None

class UnitCreate(UnitBase):
    pass

class UnitUpdate(UnitBase):
    pass

class UnitResponse(UnitBase):
    id: int
    condominium_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

router = APIRouter()

@router.get("/{condominium_id}/units", response_model=List[UnitResponse])
def get_units(condominium_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    units = db.query(Unit).filter(Unit.condominium_id == condominium_id).offset(skip).limit(limit).all()
    return units

@router.get("/{condominium_id}/units/{unit_id}", response_model=UnitResponse)
def get_unit(condominium_id: int, unit_id: int, db: Session = Depends(get_db)):
    unit = db.query(Unit).filter(Unit.condominium_id == condominium_id, Unit.id == unit_id).first()
    if unit is None:
        raise HTTPException(status_code=404, detail="Unidade não encontrada")
    return unit

@router.post("/{condominium_id}/units", response_model=UnitResponse)
def create_unit(condominium_id: int, unit: UnitCreate, db: Session = Depends(get_db)):
    try:
        db_unit = Unit(**unit.dict(), condominium_id=condominium_id)
        db.add(db_unit)
        db.commit()
        db.refresh(db_unit)
        return db_unit
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao criar unidade: {str(e)}")

@router.put("/{condominium_id}/units/{unit_id}", response_model=UnitResponse)
def update_unit(condominium_id: int, unit_id: int, unit: UnitUpdate, db: Session = Depends(get_db)):
    db_unit = db.query(Unit).filter(Unit.condominium_id == condominium_id, Unit.id == unit_id).first()
    if db_unit is None:
        raise HTTPException(status_code=404, detail="Unidade não encontrada")
    
    for key, value in unit.dict().items():
        setattr(db_unit, key, value)
    
    try:
        db.commit()
        db.refresh(db_unit)
        return db_unit
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao atualizar unidade: {str(e)}")

@router.delete("/{condominium_id}/units/{unit_id}")
def delete_unit(condominium_id: int, unit_id: int, db: Session = Depends(get_db)):
    db_unit = db.query(Unit).filter(Unit.condominium_id == condominium_id, Unit.id == unit_id).first()
    if db_unit is None:
        raise HTTPException(status_code=404, detail="Unidade não encontrada")
        
    try:
        db.delete(db_unit)
        db.commit()
        return {"message": "Unidade excluída com sucesso"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao excluir unidade: {str(e)}")
