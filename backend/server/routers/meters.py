from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from dbmodels.database import get_db
from dbmodels.meters import Meter
from dbmodels.units import Unit

router = APIRouter()

# Modelos Pydantic para validação de dados
class MeterBase(BaseModel):
    unit_id: int
    measurement_type_id: int
    serial_number: Optional[str] = None
    active: Optional[bool] = True

class MeterCreate(MeterBase):
    pass

class MeterUpdate(MeterBase):
    unit_id: Optional[int] = None
    measurement_type_id: Optional[int] = None
    serial_number: Optional[str] = None
    active: Optional[bool] = None

class MeterResponse(MeterBase):
    id: int
    active: Optional[bool] = True
    class Config:
        orm_mode = True

# Endpoints para operações CRUD de medidores
@router.post("/", response_model=MeterResponse)
def create_meter(meter: MeterCreate, db: Session = Depends(get_db)):
    # Verifica se a unidade existe
    unit = db.query(Unit).filter(Unit.id == meter.unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unidade não encontrada")
    
    db_meter = Meter(**meter.dict())
    db.add(db_meter)
    db.commit()
    db.refresh(db_meter)

    # Atualiza o contador de medidores na unidade
    unit.meters_count = db.query(Meter).filter(Meter.unit_id == unit.id).count()
    db.commit()

    # Atualiza o contador de medidores no condomínio
    condominium = unit.condominium
    if condominium:
        condominium.meters_count = db.query(Meter).join(Unit).filter(Unit.condominium_id == condominium.id).count()
        db.commit()

    return db_meter

@router.get("/", response_model=List[MeterResponse])
def list_meters(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    meters = db.query(Meter).offset(skip).limit(limit).all()
    return meters

@router.get("/{meter_id}", response_model=MeterResponse)
def get_meter(meter_id: int, db: Session = Depends(get_db)):
    meter = db.query(Meter).filter(Meter.id == meter_id).first()
    if meter is None:
        raise HTTPException(status_code=404, detail="Medidor não encontrado")
    return meter

@router.get("/units/{unit_id}/meters/", response_model=List[MeterResponse])
def get_meters_by_unit(unit_id: int, db: Session = Depends(get_db)):
    # Verifica se a unidade existe
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unidade não encontrada")
        
    meters = db.query(Meter).filter(Meter.unit_id == unit_id).all()
    return meters

@router.put("/{meter_id}", response_model=MeterResponse)
def update_meter(meter_id: int, meter: MeterUpdate, db: Session = Depends(get_db)):
    db_meter = db.query(Meter).filter(Meter.id == meter_id).first()
    if db_meter is None:
        raise HTTPException(status_code=404, detail="Medidor não encontrado")
    
    # Atualiza apenas os campos fornecidos
    meter_data = meter.dict(exclude_unset=True)
    for key, value in meter_data.items():
        setattr(db_meter, key, value)
    
    db.commit()
    db.refresh(db_meter)
    return db_meter

@router.delete("/{meter_id}")
def delete_meter(meter_id: int, db: Session = Depends(get_db)):
    db_meter = db.query(Meter).filter(Meter.id == meter_id).first()
    if db_meter is None:
        raise HTTPException(status_code=404, detail="Medidor não encontrado")

    # Pega a unidade e o condomínio antes de deletar
    unit = db.query(Unit).filter(Unit.id == db_meter.unit_id).first()
    condominium = unit.condominium if unit else None

    db.delete(db_meter)
    db.commit()

    # Atualiza o contador de medidores na unidade
    if unit:
        unit.meters_count = db.query(Meter).filter(Meter.unit_id == unit.id).count()
        db.commit()

    # Atualiza o contador de medidores no condomínio
    if condominium:
        condominium.meters_count = db.query(Meter).join(Unit).filter(Unit.condominium_id == condominium.id).count()
        db.commit()

    return {"message": "Medidor excluído com sucesso"}
