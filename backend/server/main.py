import io
import os
import numpy as np
from PIL import Image
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db, Reading, Base, engine
import readings
import users
import condominiums
import units

# Criar todas as tabelas
Base.metadata.create_all(bind=engine)

# FastAPI app
app = FastAPI(
    title="API de Detecção de Números",
    description="API para detecção de números em imagens usando YOLOv5 e YOLOv8",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4000", "http://localhost:4200"],  # Adicionando origem do Angular
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Importa funções do utils.py
from utilits import run_yolov5, run_yolov8_obb

# Adiciona os endpoints de leituras, usuários e condomínios
app.include_router(readings.router, prefix="/readings", tags=["readings"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(condominiums.router, prefix="/condominiums", tags=["condominiums"])
app.include_router(units.router, prefix="/condominiums", tags=["units"])

# Criar pasta para salvar imagens se não existir
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)



@app.get("/health")
async def health_check():
    """
    Endpoint para verificar a saúde da API.
    
    Returns:
        dict: Status da API
    """
    return {"status": "ok"}


def extract_number_from_results(results):
    """
    Extrai o número detectado dos resultados ordenados por posição.
    
    Args:
        results (list): Lista de resultados de detecção
        
    Returns:
        str: Número detectado
    """
    if not results:
        return ""
    sorted_results = sorted(results, key=lambda r: r["box"][0])
    digits = []
    for r in sorted_results:
        if r["confidence"] < 0.3:
            continue
        digits.append(str(r["class_id"]))
    return ''.join(digits)


@app.post("/detect/")
async def detect_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Arquivo deve ser uma imagem")
            
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Arquivo vazio")
            
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        image_np = np.array(image)

        yolov5_results = run_yolov5(image_np)
        yolov8_results = run_yolov8_obb(image_np)

        best_result = yolov8_results if yolov8_results["confidence"] > yolov5_results["confidence"] else yolov5_results
        
        # Salvar imagem
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        image_filename = f"reading_{timestamp}.jpg"
        image_path = os.path.join(UPLOAD_DIR, image_filename)
        image.save(image_path)
        
        # Salvar leitura no banco
        reading = Reading(
            number_detected=best_result["number_detected"],
            confidence=best_result["confidence"],
            image_path=image_path,
            # user_id será adicionado quando implementarmos autenticação
        )
        db.add(reading)
        db.commit()
        db.refresh(reading)

        return {
            "id": reading.id,
            "number_detected": reading.number_detected,
            "confidence": reading.confidence,
            "timestamp": reading.timestamp,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

