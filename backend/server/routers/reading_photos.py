from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os
import numpy as np
from PIL import Image
import io
from datetime import datetime

from dbmodels.database import get_db
from dbmodels.reading_photos import ReadingPhoto, ReadingPhotoResponse, ReadingPhotoCreate, ReadingPhotoUpdate
from dbmodels.readings import Reading
from utilits import run_yolov8_obb

# Configuração da pasta de uploads usando variável de ambiente
UPLOAD_DIR = os.environ.get('UPLOAD_DIR', os.path.join(os.path.dirname(__file__), "..", "uploads"))
# Normalizar o caminho para garantir que funcione corretamente
UPLOAD_DIR = os.path.abspath(UPLOAD_DIR)

# Criar diretório se não existir
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

router = APIRouter()

def rotate_box_coordinates(box: list, image_width: int, image_height: int, degrees: int = 90) -> list:
    """
    Rotaciona as coordenadas do bounding box.
    
    Args:
        box: Lista com coordenadas [x1, y1, x2, y2]
        image_width: Largura da imagem original
        image_height: Altura da imagem original
        degrees: Graus para rotacionar (90, 180, 270)
    
    Returns:
        list: Coordenadas rotacionadas [x1, y1, x2, y2]
    """
    if not box or len(box) != 4:
        return box
    
    x1, y1, x2, y2 = box
    
    print(f"[DEBUG] Rotacionando box {degrees}° - Original: x1={x1}, y1={y1}, x2={x2}, y2={y2}")
    print(f"[DEBUG] Dimensões da imagem: {image_width}x{image_height}")
    
    if degrees == 90:
        # Rotação 90° horário: (x,y) -> (height-y, x)
        new_x1 = image_height - y2
        new_y1 = x1
        new_x2 = image_height - y1
        new_y2 = x2
    elif degrees == -90:
        # Rotação 90° anti-horário: (x,y) -> (y, width-x)
        new_x1 = y1
        new_y1 = image_width - x2
        new_x2 = y2
        new_y2 = image_width - x1
    elif degrees == 180:
        # Rotação 180°: (x,y) -> (width-x, height-y)
        new_x1 = image_width - x2
        new_y1 = image_height - y2
        new_x2 = image_width - x1
        new_y2 = image_height - y1
    elif degrees == 270:
        # Rotação 270° horário: (x,y) -> (y, width-x)
        new_x1 = y1
        new_y1 = image_width - x2
        new_x2 = y2
        new_y2 = image_width - x1
    else:
        # Sem rotação
        new_x1, new_y1, new_x2, new_y2 = x1, y1, x2, y2
    
    # Garantir que x1 <= x2 e y1 <= y2
    new_x1, new_x2 = min(new_x1, new_x2), max(new_x1, new_x2)
    new_y1, new_y2 = min(new_y1, new_y2), max(new_y1, new_y2)
    
    rotated_box = [new_x1, new_y1, new_x2, new_y2]
    print(f"[DEBUG] Box rotacionado: x1={new_x1}, y1={new_y1}, x2={new_x2}, y2={new_y2}")
    
    return rotated_box

def crop_image_with_box(image: Image.Image, box: list, rotate_box_degrees: int = 0) -> Image.Image:
    """
    Recorta uma imagem usando as coordenadas do box retornado pelo YOLOv8.
    Opcionalmente rotaciona as coordenadas do box antes do crop.
    
    Args:
        image: Imagem PIL original
        box: Lista com coordenadas [x1, y1, x2, y2]
        rotate_box_degrees: Graus para rotacionar as coordenadas do box (padrão: 0)
    
    Returns:
        Image.Image: Imagem recortada
    """
    if not box or len(box) != 4:
        print("[DEBUG] Box inválido ou vazio, retornando imagem original")
        return image
    
    # Obter dimensões da imagem
    width, height = image.size
    print(f"[DEBUG] Imagem original: {width}x{height}")
    
    # Rotacionar as coordenadas do box se necessário
    if rotate_box_degrees != 0:
        rotated_box = rotate_box_coordinates(box, width, height, rotate_box_degrees)
    else:
        rotated_box = box
        print(f"[DEBUG] Box original (sem rotação): x1={box[0]}, y1={box[1]}, x2={box[2]}, y2={box[3]}")
    
    x1, y1, x2, y2 = rotated_box
    
    # Converter para inteiros e limitar aos bounds da imagem
    x1 = max(0, min(int(x1), width - 1))
    y1 = max(0, min(int(y1), height - 1))
    x2 = max(x1 + 1, min(int(x2), width))  # x2 deve ser > x1
    y2 = max(y1 + 1, min(int(y2), height))  # y2 deve ser > y1
    
    print(f"[DEBUG] Box final ajustado: x1={x1}, y1={y1}, x2={x2}, y2={y2}")
    
    # Verificar se o box é válido (tem área > 0)
    crop_width = x2 - x1
    crop_height = y2 - y1
    
    if crop_width <= 0 or crop_height <= 0:
        print(f"[DEBUG] Box com dimensões inválidas: {crop_width}x{crop_height}, retornando imagem original")
        return image
    
    # Fazer o crop
    cropped_image = image.crop((x1, y1, x2, y2))
    print(f"[DEBUG] Imagem recortada: {cropped_image.size[0]}x{cropped_image.size[1]}")
    
    return cropped_image

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

@router.post("/readings/{reading_id}/photos/upload")
async def upload_reading_photo(
    reading_id: int,
    file: UploadFile = File(...),
    cropped_file: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    """
    Upload de foto para uma leitura específica.
    Salva os arquivos no sistema de arquivos e cria o registro no banco.
    
    Se não for enviada uma imagem cropped_file, fará a detecção automática 
    e criará a imagem cropped usando o box da detecção YOLOv8.
    """
    print(f"[DEBUG] Upload foto para leitura {reading_id}")
    print(f"[DEBUG] Arquivo recebido: {file.filename}, tipo: {file.content_type}")
    
    # Verifica se a leitura existe
    reading = db.query(Reading).filter(Reading.id == reading_id).first()
    if not reading:
        print(f"[DEBUG] Leitura {reading_id} não encontrada")
        raise HTTPException(status_code=404, detail="Leitura não encontrada")
    
    print(f"[DEBUG] Leitura encontrada: ID {reading.id}")
    
    # Validar tipo de arquivo
    if not file.content_type.startswith('image/'):
        print(f"[DEBUG] Tipo de arquivo inválido: {file.content_type}")
        raise HTTPException(status_code=400, detail="Arquivo deve ser uma imagem")

    try:
        # Ler arquivo principal
        contents = await file.read()
        
        # Converter para PIL Image para fazer detecção e crop
        image = Image.open(io.BytesIO(contents))
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Converter para numpy array para detecção
        image_np = np.array(image)
        
        print(f"[DEBUG] Fazendo detecção na imagem...")
        
        # Fazer detecção YOLOv8 para obter número e box
        detection_result = run_yolov8_obb(image_np)
        print(f"[DEBUG] Resultado detecção: {detection_result}")
        
        detected_number = detection_result.get("number_detected")
        detected_box = detection_result.get("box")
        confidence = detection_result.get("confidence", 0)
        
        # Gerar nome único para os arquivos
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Salvar arquivo principal
        file_extension = file.filename.split('.')[-1] if file.filename and '.' in file.filename else 'jpg'
        main_filename = f"reading_{reading_id}_{timestamp}.{file_extension}"
        main_filepath = os.path.join(UPLOAD_DIR, main_filename)
        
        print(f"[DEBUG] Salvando arquivo em: {main_filepath}")
        
        # Salvar arquivo principal
        with open(main_filepath, "wb") as f:
            f.write(contents)
            
        print(f"[DEBUG] Arquivo salvo com sucesso: {main_filename}")
        
        # Criar imagem cropped
        cropped_filepath = None
        cropped_filename = None
        
        # Priorizar crop automático se temos detecção, caso contrário usar manual
        if detected_box and len(detected_box) == 4:
            # Se temos box da detecção, fazer crop automaticamente (prioridade)
            print(f"[DEBUG] Fazendo crop automático usando box da detecção: {detected_box}")
            
            # Verificar se o box faz sentido (não está vazio ou com valores estranhos)
            x1, y1, x2, y2 = detected_box
            if x1 >= x2 or y1 >= y2:
                print(f"[DEBUG] Box inválido (x1={x1}, y1={y1}, x2={x2}, y2={y2}), tentando crop manual")
                # Fallback para crop manual se disponível
                if cropped_file:
                    print(f"[DEBUG] Usando arquivo cropped manual como fallback")
                    cropped_extension = cropped_file.filename.split('.')[-1] if cropped_file.filename and '.' in cropped_file.filename else 'jpg'
                    cropped_filename = f"reading_{reading_id}_{timestamp}_cropped.{cropped_extension}"
                    cropped_filepath = os.path.join(UPLOAD_DIR, cropped_filename)
                    
                    cropped_contents = await cropped_file.read()
                    with open(cropped_filepath, "wb") as f:
                        f.write(cropped_contents)
                        
                    print(f"[DEBUG] Arquivo cropped manual salvo: {cropped_filename}")
            else:
                cropped_image = crop_image_with_box(image, detected_box, 0)  # Sem rotação
                
                # Verificar se realmente foi feito o crop
                if cropped_image.size != image.size:
                    cropped_filename = f"reading_{reading_id}_{timestamp}_cropped_auto.jpg"
                    cropped_filepath = os.path.join(UPLOAD_DIR, cropped_filename)
                    
                    # Salvar imagem cropped
                    cropped_image.save(cropped_filepath, format='JPEG', quality=95)
                    
                    print(f"[DEBUG] Arquivo cropped automático salvo: {cropped_filename} (tamanho: {cropped_image.size})")
                else:
                    print(f"[DEBUG] AVISO: Imagem cropped tem o mesmo tamanho da original - usando crop manual se disponível")
                
                # Fallback para crop manual se o automático não funcionou adequadamente
                if cropped_file:
                    print(f"[DEBUG] Usando arquivo cropped manual como fallback")
                    cropped_extension = cropped_file.filename.split('.')[-1] if cropped_file.filename and '.' in cropped_file.filename else 'jpg'
                    cropped_filename = f"reading_{reading_id}_{timestamp}_cropped.{cropped_extension}"
                    cropped_filepath = os.path.join(UPLOAD_DIR, cropped_filename)
                    
                    cropped_contents = await cropped_file.read()
                    with open(cropped_filepath, "wb") as f:
                        f.write(cropped_contents)
                        
                    print(f"[DEBUG] Arquivo cropped manual salvo: {cropped_filename}")
                        
        elif cropped_file:
            # Se não há detecção mas foi enviado um arquivo cropped manual, usar esse
            print(f"[DEBUG] Sem detecção automática, usando arquivo cropped manual fornecido")
            cropped_extension = cropped_file.filename.split('.')[-1] if cropped_file.filename and '.' in cropped_file.filename else 'jpg'
            cropped_filename = f"reading_{reading_id}_{timestamp}_cropped.{cropped_extension}"
            cropped_filepath = os.path.join(UPLOAD_DIR, cropped_filename)
            
            cropped_contents = await cropped_file.read()
            with open(cropped_filepath, "wb") as f:
                f.write(cropped_contents)
                
            print(f"[DEBUG] Arquivo cropped manual salvo: {cropped_filename}")
        else:
            print(f"[DEBUG] Sem detecção automática nem arquivo cropped manual")
        
        # Criar registro no banco
        db_photo = ReadingPhoto(
            reading_id=reading_id,
            file_path=main_filepath,
            cropped_file_path=cropped_filepath,
            is_cropped=bool(cropped_filepath),
            created_at=datetime.utcnow()
        )
        db.add(db_photo)
        db.commit()
        db.refresh(db_photo)
        
        print(f"[DEBUG] Registro criado no banco com ID: {db_photo.id}")
        
        return {
            "data": db_photo,
            "message": "Foto salva com sucesso",
            "main_file": main_filename,
            "cropped_file": cropped_filename if cropped_filepath else None,
            "detection": {
                "number_detected": detected_number,
                "confidence": confidence,
                "box": detected_box
            } if detected_number else None
        }
        
    except Exception as e:
        print(f"[DEBUG] Erro ao salvar foto: {str(e)}")
        db.rollback()
        # Limpar arquivos se houver erro
        if 'main_filepath' in locals() and os.path.exists(main_filepath):
            os.remove(main_filepath)
        if cropped_filepath and os.path.exists(cropped_filepath):
            os.remove(cropped_filepath)
        raise HTTPException(status_code=400, detail=f"Erro ao salvar foto: {str(e)}")

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
