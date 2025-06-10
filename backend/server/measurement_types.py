from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, Boolean
from typing import List, Optional
from pydantic import BaseModel
from database import Base, get_db

class MeasurementType(Base):
    __tablename__ = "measurement_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    unit = Column(String)  # Unidade de medida (m³, kWh, etc.)
    active = Column(Boolean, default=True)

# Modelos Pydantic para validação de dados
class MeasurementTypeBase(BaseModel):
    name: str
    unit: str
    active: bool = True

class MeasurementTypeCreate(MeasurementTypeBase):
    pass

class MeasurementTypeUpdate(BaseModel):
    name: Optional[str] = None
    unit: Optional[str] = None
    active: Optional[bool] = None

class MeasurementTypeResponse(MeasurementTypeBase):
    id: int

    class Config:
        orm_mode = True

# Rotas da API
router = APIRouter()

@router.post("/measurement-types/", response_model=MeasurementTypeResponse)
def create_measurement_type(measurement_type: MeasurementTypeCreate, db: Session = Depends(get_db)):
    # Verificar se já existe um tipo de medição com o mesmo nome
    db_measurement_type = db.query(MeasurementType).filter(MeasurementType.name == measurement_type.name).first()
    if db_measurement_type:
        raise HTTPException(status_code=400, detail="Tipo de medição já existe")
    
    db_measurement_type = MeasurementType(**measurement_type.dict())
    db.add(db_measurement_type)
    db.commit()
    db.refresh(db_measurement_type)
    return db_measurement_type

@router.get("/measurement-types/", response_model=List[MeasurementTypeResponse])
def list_measurement_types(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    measurement_types = db.query(MeasurementType).offset(skip).limit(limit).all()
    return measurement_types

@router.get("/measurement-types/{measurement_type_id}", response_model=MeasurementTypeResponse)
def get_measurement_type(measurement_type_id: int, db: Session = Depends(get_db)):
    measurement_type = db.query(MeasurementType).filter(MeasurementType.id == measurement_type_id).first()
    if measurement_type is None:
        raise HTTPException(status_code=404, detail="Tipo de medição não encontrado")
    return measurement_type

@router.put("/measurement-types/{measurement_type_id}", response_model=MeasurementTypeResponse)
def update_measurement_type(measurement_type_id: int, measurement_type: MeasurementTypeUpdate, db: Session = Depends(get_db)):
    db_measurement_type = db.query(MeasurementType).filter(MeasurementType.id == measurement_type_id).first()
    if db_measurement_type is None:
        raise HTTPException(status_code=404, detail="Tipo de medição não encontrado")
    
    # Atualiza apenas os campos fornecidos
    measurement_type_data = measurement_type.dict(exclude_unset=True)
    for key, value in measurement_type_data.items():
        setattr(db_measurement_type, key, value)
    
    db.commit()
    db.refresh(db_measurement_type)
    return db_measurement_type

@router.delete("/measurement-types/{measurement_type_id}")
def delete_measurement_type(measurement_type_id: int, db: Session = Depends(get_db)):
    db_measurement_type = db.query(MeasurementType).filter(MeasurementType.id == measurement_type_id).first()
    if db_measurement_type is None:
        raise HTTPException(status_code=404, detail="Tipo de medição não encontrado")
    
    db.delete(db_measurement_type)
    db.commit()
    return {"message": "Tipo de medição excluído com sucesso"}
