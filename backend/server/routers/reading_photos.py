from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from dbmodels.database import get_db
from dbmodels.reading_photos import ReadingPhoto, ReadingPhotoResponse, ReadingPhotoCreate, ReadingPhotoUpdate
from dbmodels.readings import Reading

router = APIRouter()

@router.get("/readings/{reading_id}/photos", response_model=List[ReadingPhotoResponse])
def get_reading_photos(reading_id: int, db: Session = Depends(get_db)):
    # Verifica se a leitura existe
    reading = db.query(Reading).filter(Reading.id == reading_id).first()
    if not reading:
        raise HTTPException(status_code=404, detail="Leitura não encontrada")
    
    photos = db.query(ReadingPhoto).filter(ReadingPhoto.reading_id == reading_id).all()
    return photos

@router.get("/photos/{photo_id}", response_model=ReadingPhotoResponse)
def get_reading_photo(photo_id: int, db: Session = Depends(get_db)):
    photo = db.query(ReadingPhoto).filter(ReadingPhoto.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Foto não encontrada")
    return photo

@router.post("/readings/{reading_id}/photos", response_model=ReadingPhotoResponse)
def create_reading_photo(
    reading_id: int,
    photo: ReadingPhotoCreate,
    db: Session = Depends(get_db)
):
    # Verifica se a leitura existe
    reading = db.query(Reading).filter(Reading.id == reading_id).first()
    if not reading:
        raise HTTPException(status_code=404, detail="Leitura não encontrada")
    
    try:
        db_photo = ReadingPhoto(**photo.dict(), reading_id=reading_id)
        db.add(db_photo)
        db.commit()
        db.refresh(db_photo)
        return db_photo
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/photos/{photo_id}", response_model=ReadingPhotoResponse)
def update_reading_photo(
    photo_id: int,
    photo: ReadingPhotoUpdate,
    db: Session = Depends(get_db)
):
    db_photo = db.query(ReadingPhoto).filter(ReadingPhoto.id == photo_id).first()
    if not db_photo:
        raise HTTPException(status_code=404, detail="Foto não encontrada")
    
    try:
        # Atualiza apenas os campos fornecidos
        photo_data = photo.dict(exclude_unset=True)
        for key, value in photo_data.items():
            setattr(db_photo, key, value)
        
        db.commit()
        db.refresh(db_photo)
        return db_photo
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/photos/{photo_id}")
def delete_reading_photo(photo_id: int, db: Session = Depends(get_db)):
    db_photo = db.query(ReadingPhoto).filter(ReadingPhoto.id == photo_id).first()
    if not db_photo:
        raise HTTPException(status_code=404, detail="Foto não encontrada")
    
    try:
        db.delete(db_photo)
        db.commit()
        return {"message": "Foto excluída com sucesso"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
