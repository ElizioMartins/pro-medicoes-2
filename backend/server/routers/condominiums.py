from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime

from ..models import get_db, Condominium, Unit
from ..models.condominiums import CondominiumBase, CondominiumCreate, CondominiumUpdate, CondominiumResponse

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
    # Verifica se já existe um condomínio com o mesmo CNPJ
    existing_condominium = db.query(Condominium).filter(Condominium.cnpj == condominium.cnpj).first()
    if existing_condominium:
        raise HTTPException(status_code=400, detail="CNPJ já cadastrado")
    
    db_condominium = Condominium(**condominium.dict())
    db.add(db_condominium)
    
    try:
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
    
    # Verifica se o novo CNPJ já está em uso por outro condomínio
    if condominium.cnpj != db_condominium.cnpj:
        existing_condominium = db.query(Condominium).filter(Condominium.cnpj == condominium.cnpj).first()
        if existing_condominium:
            raise HTTPException(status_code=400, detail="CNPJ já cadastrado")
    
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
    db_condominium = db.query(Condominium).filter(Condominium.id == condominium_id).first()
    if db_condominium is None:
        raise HTTPException(status_code=404, detail="Condomínio não encontrado")
    
    try:
        db.delete(db_condominium)
        db.commit()
        return {"message": "Condomínio excluído com sucesso"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao excluir condomínio: {str(e)}")
