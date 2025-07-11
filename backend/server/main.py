import io
import os
import numpy as np
from PIL import Image
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime

from dbmodels import Base, engine
from dbmodels.database import get_db
from dbmodels.readings import Reading, ReadingStatus
from routers.readings import router as readings_router
from routers.users import router as users_router
from routers.condominiums import router as condominiums_router
from routers.units import router as units_router
from routers.meters import router as meters_router
from routers.measurement_types import router as measurement_types_router
from routers.reading_photos import router as reading_photos_router

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
# from utilits import run_yolov5, run_yolov8_obb  # YOLOv5 comentado temporariamente
from utilits import run_yolov8_obb

# Adiciona os endpoints
app.include_router(readings_router, prefix="/api/readings", tags=["readings"])
app.include_router(users_router, prefix="/api/users", tags=["users"])
app.include_router(condominiums_router, prefix="/api/condominiums", tags=["condominiums"])
app.include_router(units_router, prefix="/api", tags=["units"])  # Sem prefix para incluir condominiums/x/units
app.include_router(meters_router, prefix="/api/meters", tags=["meters"])
app.include_router(measurement_types_router, prefix="/api/measurement-types", tags=["measurement-types"])
app.include_router(reading_photos_router, prefix="/api", tags=["reading-photos"])

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

        # Usando apenas YOLOv8 por enquanto
        # yolov5_results = run_yolov5(image_np)  # Comentado temporariamente
        yolov8_results = run_yolov8_obb(image_np)

        # Usar apenas YOLOv8 results
        best_result = yolov8_results
        # best_result = yolov8_results if yolov8_results["confidence"] > yolov5_results["confidence"] else yolov5_results
        
        # Salvar imagem
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        image_filename = f"reading_{timestamp}.jpg"
        image_path = os.path.join(UPLOAD_DIR, image_filename)
        image.save(image_path)
        
        # Salvar leitura no banco
        reading = Reading(
            meter_id=1,  # Temporário - será fornecido pelo frontend
            current_reading=best_result["number_detected"],
            status=ReadingStatus.COMPLETED,
            observations=f"Detecção automática com confiança: {best_result['confidence']:.2f}",
            # user_id será adicionado quando implementarmos autenticação
        )
        db.add(reading)
        db.commit()
        db.refresh(reading)

        return {
            "id": reading.id,
            "number_detected": reading.current_reading,
            "confidence": best_result["confidence"],
            "timestamp": reading.created_at,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

