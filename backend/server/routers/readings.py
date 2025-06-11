from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..models import get_db, Reading, Meter, ReadingPhoto
from ..models.readings import ReadingResponse, ReadingCreate, ReadingUpdate

router = APIRouter()

@router.get("/", response_model=List[ReadingResponse])
def get_readings(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    readings = db.query(Reading).offset(skip).limit(limit).all()
    return readings

@router.get("/{reading_id}", response_model=ReadingResponse)
def get_reading(reading_id: int, db: Session = Depends(get_db)):
    reading = db.query(Reading).filter(Reading.id == reading_id).first()
    if reading is None:
        raise HTTPException(status_code=404, detail="Leitura não encontrada")
    return reading

@router.post("/meters/{meter_id}/readings", response_model=ReadingResponse)
def create_reading(
    meter_id: int,
    reading: ReadingCreate,
    db: Session = Depends(get_db)
):
    # Verifica se o medidor existe
    meter = db.query(Meter).filter(Meter.id == meter_id).first()
    if not meter:
        raise HTTPException(status_code=404, detail="Medidor não encontrado")
    
    try:
        db_reading = Reading(**reading.dict(exclude={'photos'}))
        db.add(db_reading)
        
        # Se foram enviadas fotos, cria os registros
        if reading.photos:
            for photo in reading.photos:
                db_photo = ReadingPhoto(
                    reading=db_reading,
                    **photo.dict()
                )
                db.add(db_photo)
        
        # Atualiza a data da última leitura do medidor
        meter.last_reading_date = datetime.utcnow()
        
        db.commit()
        db.refresh(db_reading)
        return db_reading
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{reading_id}", response_model=ReadingResponse)
def update_reading(
    reading_id: int,
    reading: ReadingUpdate,
    db: Session = Depends(get_db)
):
    db_reading = db.query(Reading).filter(Reading.id == reading_id).first()
    if db_reading is None:
        raise HTTPException(status_code=404, detail="Leitura não encontrada")
    
    try:
        # Atualiza apenas os campos fornecidos
        reading_data = reading.dict(exclude_unset=True)
        for key, value in reading_data.items():
            setattr(db_reading, key, value)
        
        db.commit()
        db.refresh(db_reading)
        return db_reading
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{reading_id}")
def delete_reading(reading_id: int, db: Session = Depends(get_db)):
    db_reading = db.query(Reading).filter(Reading.id == reading_id).first()
    if db_reading is None:
        raise HTTPException(status_code=404, detail="Leitura não encontrada")
    
    try:
        db.delete(db_reading)
        db.commit()
        return {"message": "Leitura excluída com sucesso"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
