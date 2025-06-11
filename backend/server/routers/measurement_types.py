from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..models import get_db, MeasurementType
from ..models.measurement_types import MeasurementTypeBase, MeasurementTypeCreate, MeasurementTypeUpdate, MeasurementTypeResponse

router = APIRouter()

@router.get("/", response_model=List[MeasurementTypeResponse])
def get_measurement_types(db: Session = Depends(get_db)):
    measurement_types = db.query(MeasurementType).all()
    return measurement_types

@router.post("/", response_model=MeasurementTypeResponse)
def create_measurement_type(measurement_type: MeasurementTypeCreate, db: Session = Depends(get_db)):
    # Verificar se já existe um tipo de medição com o mesmo nome
    db_measurement_type = db.query(MeasurementType).filter(
        MeasurementType.name == measurement_type.name
    ).first()
    if db_measurement_type:
        raise HTTPException(status_code=400, detail="Tipo de medição já existe")
    
    try:
        db_measurement_type = MeasurementType(**measurement_type.dict())
        db.add(db_measurement_type)
        db.commit()
        db.refresh(db_measurement_type)
        return db_measurement_type
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{measurement_type_id}", response_model=MeasurementTypeResponse)
def get_measurement_type(measurement_type_id: int, db: Session = Depends(get_db)):
    db_measurement_type = db.query(MeasurementType).filter(
        MeasurementType.id == measurement_type_id
    ).first()
    if db_measurement_type is None:
        raise HTTPException(status_code=404, detail="Tipo de medição não encontrado")
    return db_measurement_type

@router.put("/{measurement_type_id}", response_model=MeasurementTypeResponse)
def update_measurement_type(
    measurement_type_id: int, 
    measurement_type: MeasurementTypeUpdate, 
    db: Session = Depends(get_db)
):
    db_measurement_type = db.query(MeasurementType).filter(
        MeasurementType.id == measurement_type_id
    ).first()
    if db_measurement_type is None:
        raise HTTPException(status_code=404, detail="Tipo de medição não encontrado")

    # Verifica se o novo nome já existe em outro registro
    if measurement_type.name and measurement_type.name != db_measurement_type.name:
        existing = db.query(MeasurementType).filter(
            MeasurementType.name == measurement_type.name
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Nome já está em uso")

    try:
        # Atualiza apenas os campos fornecidos
        update_data = measurement_type.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_measurement_type, key, value)
        
        db.commit()
        db.refresh(db_measurement_type)
        return db_measurement_type
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{measurement_type_id}")
def delete_measurement_type(measurement_type_id: int, db: Session = Depends(get_db)):
    db_measurement_type = db.query(MeasurementType).filter(
        MeasurementType.id == measurement_type_id
    ).first()
    if db_measurement_type is None:
        raise HTTPException(status_code=404, detail="Tipo de medição não encontrado")
    
    try:
        # Soft delete - apenas marca como inativo
        db_measurement_type.active = False
        db.commit()
        return {"message": "Tipo de medição desativado com sucesso"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
