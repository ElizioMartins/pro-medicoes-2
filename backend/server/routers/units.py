from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from dbmodels.database import get_db
from dbmodels.units import Unit, UnitBase, UnitCreate, UnitUpdate, UnitResponse
from dbmodels.condominiums import Condominium
from dbmodels.users import User
from dependencies import get_current_user, get_manager_or_admin, get_any_authenticated_user

router = APIRouter()

@router.get("/condominiums/{condominium_id}/units", response_model=dict)
def get_units(
    condominium_id: int, 
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_any_authenticated_user)
):
    # Verifica se o condomínio existe
    condominium = db.query(Condominium).filter(Condominium.id == condominium_id).first()
    if not condominium:
        raise HTTPException(status_code=404, detail="Condomínio não encontrado")
    
    # Contar total
    total = db.query(Unit).filter(Unit.condominium_id == condominium_id).count()
    
    # Buscar unidades com paginação
    units = db.query(Unit).filter(Unit.condominium_id == condominium_id).offset(skip).limit(limit).all()
    
    return {
        "units": units,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/units/{unit_id}", response_model=UnitResponse)
def get_unit(
    unit_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_any_authenticated_user)
):
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if unit is None:
        raise HTTPException(status_code=404, detail="Unidade não encontrada")
    return unit

@router.post("/condominiums/{condominium_id}/units", response_model=UnitResponse)
def create_unit(
    condominium_id: int, 
    unit: UnitCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_manager_or_admin)
):
    # Verifica se o condomínio existe
    condominium = db.query(Condominium).filter(Condominium.id == condominium_id).first()
    if not condominium:
        raise HTTPException(status_code=404, detail="Condomínio não encontrado")
    
    # Verifica se já existe uma unidade com o mesmo número no condomínio
    existing_unit = db.query(Unit).filter(
        Unit.condominium_id == condominium_id,
        Unit.number == unit.number
    ).first()
    if existing_unit:
        raise HTTPException(status_code=400, detail="Já existe uma unidade com este número neste condomínio")
    
    try:
        db_unit = Unit(**unit.dict(), condominium_id=condominium_id)
        db.add(db_unit)
        db.commit()
        db.refresh(db_unit)
        
        # Atualiza o contador de unidades no condomínio
        condominium.units_count = db.query(Unit).filter(
            Unit.condominium_id == condominium_id
        ).count()
        db.commit()
        
        return db_unit
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao criar unidade: {str(e)}")

@router.put("/condominiums/{condominium_id}/units/{unit_id}", response_model=UnitResponse)
def update_unit(
    condominium_id: int, 
    unit_id: int, 
    unit: UnitUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_manager_or_admin)
):
    # Verifica se a unidade existe e pertence ao condomínio
    db_unit = db.query(Unit).filter(
        Unit.id == unit_id,
        Unit.condominium_id == condominium_id
    ).first()
    if db_unit is None:
        raise HTTPException(status_code=404, detail="Unidade não encontrada")
    
    # Verifica se o novo número já existe (se estiver sendo alterado)
    if unit.number and unit.number != db_unit.number:
        existing_unit = db.query(Unit).filter(
            Unit.condominium_id == condominium_id,
            Unit.number == unit.number,
            Unit.id != unit_id
        ).first()
        if existing_unit:
            raise HTTPException(status_code=400, detail="Já existe uma unidade com este número neste condomínio")
    
    try:
        # Atualiza apenas os campos fornecidos
        for key, value in unit.dict(exclude_unset=True).items():
            setattr(db_unit, key, value)
        
        db.commit()
        db.refresh(db_unit)
        return db_unit
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao atualizar unidade: {str(e)}")

@router.delete("/condominiums/{condominium_id}/units/{unit_id}")
def delete_unit(
    condominium_id: int, 
    unit_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_manager_or_admin)
):
    # Verifica se a unidade existe e pertence ao condomínio
    db_unit = db.query(Unit).filter(
        Unit.id == unit_id,
        Unit.condominium_id == condominium_id
    ).first()
    if db_unit is None:
        raise HTTPException(status_code=404, detail="Unidade não encontrada")
    
    # Verifica se há medidores associados
    # (assumindo que existe uma tabela de medidores)
    # meters_count = db.query(Meter).filter(Meter.unit_id == unit_id).count()
    # if meters_count > 0:
    #     raise HTTPException(status_code=400, detail=f"Não é possível excluir a unidade. Existem {meters_count} medidores associados.")
    
    try:
        db.delete(db_unit)
        
        # Atualiza o contador de unidades no condomínio
        condominium = db.query(Condominium).filter(Condominium.id == condominium_id).first()
        if condominium:
            condominium.units_count = db.query(Unit).filter(
                Unit.condominium_id == condominium_id
            ).count()
        
        db.commit()
        return {"message": "Unidade excluída com sucesso"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao excluir unidade: {str(e)}")
