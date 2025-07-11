from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime

from dbmodels.database import get_db
from dbmodels.condominiums import Condominium, CondominiumBase, CondominiumCreate, CondominiumUpdate, CondominiumResponse
from dbmodels.units import Unit
from dbmodels.users import User
from dependencies import get_current_user, get_manager_or_admin, get_any_authenticated_user

router = APIRouter()

@router.get("/", response_model=dict)
def get_condominiums(
    skip: int = 0, 
    limit: int = 100, 
    search: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_any_authenticated_user)  # Qualquer usuário autenticado pode ver
):
    query = db.query(Condominium)
    
    # Aplicar filtro de busca se fornecido
    if search:
        query = query.filter(
            Condominium.name.ilike(f"%{search}%") | 
            Condominium.cnpj.ilike(f"%{search}%") |
            Condominium.address.ilike(f"%{search}%")
        )
    
    # Contar total de registros
    total = query.count()
    
    # Aplicar paginação
    condominiums = query.offset(skip).limit(limit).all()
    
    return {
        "condominiums": condominiums,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/{condominium_id}", response_model=CondominiumResponse)
def get_condominium(
    condominium_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_any_authenticated_user)  # Qualquer usuário autenticado pode ver
):
    condominium = db.query(Condominium).filter(Condominium.id == condominium_id).first()
    if condominium is None:
        raise HTTPException(status_code=404, detail="Condomínio não encontrado")
    return condominium

@router.post("/", response_model=CondominiumResponse)
def create_condominium(
    condominium: CondominiumCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_manager_or_admin)  # Apenas managers e admins podem criar
):
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
def update_condominium(
    condominium_id: int, 
    condominium: CondominiumUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_manager_or_admin)  # Apenas managers e admins podem atualizar
):
    db_condominium = db.query(Condominium).filter(Condominium.id == condominium_id).first()
    if db_condominium is None:
        raise HTTPException(status_code=404, detail="Condomínio não encontrado")
    
    # Verifica se o novo CNPJ já está em uso por outro condomínio
    if condominium.cnpj and condominium.cnpj != db_condominium.cnpj:
        existing_condominium = db.query(Condominium).filter(Condominium.cnpj == condominium.cnpj).first()
        if existing_condominium:
            raise HTTPException(status_code=400, detail="CNPJ já cadastrado")
    
    # Atualiza apenas os campos fornecidos
    for key, value in condominium.dict(exclude_unset=True).items():
        setattr(db_condominium, key, value)
    
    try:
        db.commit()
        db.refresh(db_condominium)
        return db_condominium
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao atualizar condomínio: {str(e)}")

@router.delete("/{condominium_id}")
def delete_condominium(
    condominium_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_manager_or_admin)  # Apenas managers e admins podem excluir
):
    db_condominium = db.query(Condominium).filter(Condominium.id == condominium_id).first()
    if db_condominium is None:
        raise HTTPException(status_code=404, detail="Condomínio não encontrado")
    
    # Verifica se há unidades associadas
    units_count = db.query(Unit).filter(Unit.condominium_id == condominium_id).count()
    if units_count > 0:
        raise HTTPException(status_code=400, detail=f"Não é possível excluir o condomínio. Existem {units_count} unidades associadas.")
    
    try:
        db.delete(db_condominium)
        db.commit()
        return {"message": "Condomínio excluído com sucesso"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao excluir condomínio: {str(e)}")
