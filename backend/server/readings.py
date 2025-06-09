from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db, Reading
from datetime import datetime

router = APIRouter()

@router.get("/readings/", response_model=List[dict])
def list_readings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    readings = db.query(Reading).offset(skip).limit(limit).all()
    return [
        {
            "id": reading.id,
            "number_detected": reading.number_detected,
            "confidence": reading.confidence,
            "timestamp": reading.timestamp,
            "image_path": reading.image_path
        }
        for reading in readings
    ]

@router.get("/readings/{reading_id}")
def get_reading(reading_id: int, db: Session = Depends(get_db)):
    reading = db.query(Reading).filter(Reading.id == reading_id).first()
    if reading is None:
        raise HTTPException(status_code=404, detail="Leitura não encontrada")
    return {
        "id": reading.id,
        "number_detected": reading.number_detected,
        "confidence": reading.confidence,
        "timestamp": reading.timestamp,
        "image_path": reading.image_path
    }

@router.delete("/readings/{reading_id}")
def delete_reading(reading_id: int, db: Session = Depends(get_db)):
    reading = db.query(Reading).filter(Reading.id == reading_id).first()
    if reading is None:
        raise HTTPException(status_code=404, detail="Leitura não encontrada")
    db.delete(reading)
    db.commit()
    return {"message": "Leitura excluída com sucesso"}
