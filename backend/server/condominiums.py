from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, Base, engine
from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from typing import List
from pydantic import BaseModel

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

# Pydantic Model
class CondominiumBase(BaseModel):
    name: str
    address: str
    cnpj: str
    manager: str
    phone: str
    email: str
    units_count: int = 0
    meters_count: int = 0
    readings_count: int = 0
    reports_count: int = 0

class CondominiumCreate(CondominiumBase):
    pass

class CondominiumUpdate(CondominiumBase):
    pass

class CondominiumResponse(CondominiumBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

router = APIRouter()

@router.get("/", response_model=List[CondominiumResponse])
def get_condominiums(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    condominiums = db.query(Condominium).offset(skip).limit(limit).all()
    return condominiums

@router.get("/{condominium_id}", response_model=CondominiumResponse)
def get_condominium(condominium_id: int, db: Session = Depends(get_db)):
    condominium = db.query(Condominium).filter(Condominium.id == condominium_id).first()
    if condominium is None:
        raise HTTPException(status_code=404, detail="Condomínio não encontrado")
    return condominium

@router.post("/", response_model=CondominiumResponse)
def create_condominium(condominium: CondominiumCreate, db: Session = Depends(get_db)):
    try:
        db_condominium = Condominium(**condominium.dict())
        db.add(db_condominium)
        db.commit()
        db.refresh(db_condominium)
        return db_condominium
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao criar condomínio: {str(e)}")

@router.put("/{condominium_id}", response_model=CondominiumResponse)
def update_condominium(condominium_id: int, condominium: CondominiumUpdate, db: Session = Depends(get_db)):
    db_condominium = db.query(Condominium).filter(Condominium.id == condominium_id).first()
    if db_condominium is None:
        raise HTTPException(status_code=404, detail="Condomínio não encontrado")
    
    for key, value in condominium.dict().items():
        setattr(db_condominium, key, value)
    
    try:
        db.commit()
        db.refresh(db_condominium)
        return db_condominium
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao atualizar condomínio: {str(e)}")

@router.delete("/{condominium_id}")
def delete_condominium(condominium_id: int, db: Session = Depends(get_db)):
    condominium = db.query(Condominium).filter(Condominium.id == condominium_id).first()
    if condominium is None:
        raise HTTPException(status_code=404, detail="Condomínio não encontrado")
    
    try:
        db.delete(condominium)
        db.commit()
        return {"message": "Condomínio excluído com sucesso"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao excluir condomínio: {str(e)}")




