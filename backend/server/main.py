import io
import numpy as np
from PIL import Image
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# FastAPI app
app = FastAPI(
    title="API de Detecção de Números",
    description="API para detecção de números em imagens usando YOLOv5 e YOLOv8",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4000"],  # ou ["*"] em dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Importa funções do utils.py
from utilits import run_yolov5, run_yolov8_obb


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
async def detect_image(file: UploadFile = File(...)):
   
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
        return {
            "number_detected": best_result["number_detected"],
        }
        # return {
        #     "yolov5": yolov5_results,
        #     "yolov8_obb": yolov8_results
        # }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

