from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..models import get_db, Unit, Condominium
from ..models.units import UnitBase, UnitCreate, UnitUpdate, UnitResponse

router = APIRouter()

@router.get("/condominiums/{condominium_id}/units", response_model=List[UnitResponse])
def get_units(condominium_id: int, db: Session = Depends(get_db)):
    # Verifica se o condomínio existe
    condominium = db.query(Condominium).filter(Condominium.id == condominium_id).first()
    if not condominium:
        raise HTTPException(status_code=404, detail="Condomínio não encontrado")
    
    units = db.query(Unit).filter(Unit.condominium_id == condominium_id).all()
    return units

@router.get("/units/{unit_id}", response_model=UnitResponse)
def get_unit(unit_id: int, db: Session = Depends(get_db)):
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if unit is None:
        raise HTTPException(status_code=404, detail="Unidade não encontrada")
    return unit

@router.post("/condominiums/{condominium_id}/units", response_model=UnitResponse)
def create_unit(condominium_id: int, unit: UnitCreate, db: Session = Depends(get_db)):
    # Verifica se o condomínio existe
    condominium = db.query(Condominium).filter(Condominium.id == condominium_id).first()
    if not condominium:
        raise HTTPException(status_code=404, detail="Condomínio não encontrado")
    
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
    db: Session = Depends(get_db)
):
    # Verifica se a unidade existe e pertence ao condomínio
    db_unit = db.query(Unit).filter(
        Unit.id == unit_id,
        Unit.condominium_id == condominium_id
    ).first()
    if db_unit is None:
        raise HTTPException(status_code=404, detail="Unidade não encontrada")
    
    try:
        for key, value in unit.dict().items():
            setattr(db_unit, key, value)
        
        db.commit()
        db.refresh(db_unit)
        return db_unit
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao atualizar unidade: {str(e)}")

@router.delete("/condominiums/{condominium_id}/units/{unit_id}")
def delete_unit(condominium_id: int, unit_id: int, db: Session = Depends(get_db)):
    # Verifica se a unidade existe e pertence ao condomínio
    db_unit = db.query(Unit).filter(
        Unit.id == unit_id,
        Unit.condominium_id == condominium_id
    ).first()
    if db_unit is None:
        raise HTTPException(status_code=404, detail="Unidade não encontrada")
    
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
