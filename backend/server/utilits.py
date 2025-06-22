import os
import numpy as np
import torch
from ultralytics import YOLO  # YOLOv5 e YOLOv8 via ultralytics
import sys
from pathlib import Path
import cv2
from torchvision.ops import nms


## YOLOv5 path - usando caminho relativo
YOLO_PATH = Path(os.path.join(os.path.dirname(__file__), 'yolov5'))
sys.path.append(str(YOLO_PATH))

from models.common import DetectMultiBackend
from utils.torch_utils import select_device
from utils.general import non_max_suppression
from utils.augmentations import letterbox

device = select_device("cuda:0" if torch.cuda.is_available() else "cpu")

# Caminhos para os modelos
model_v5_path = os.path.join(os.path.dirname(__file__), "best.pt")  # YOLOv5 model path
model_v8_path = os.path.join(os.path.dirname(__file__), "best-obb.pt")  # YOLOv8 model path

# Carregando os modelos
model_v5 = DetectMultiBackend(model_v5_path, device=device)

## POCO PENSAR UM MODELO QUE USE OS DOIS JUNTOS
#model_v5 = YOLO(model_v5_path)  # YOLOv5 model
model_v8 = YOLO(model_v8_path)  # YOLOv8 model

#print(f"Modelo YOLOv8 carregado com sucesso: {model_v8}")


def run_yolov5(image_np: np.ndarray):
    img0 = image_np.copy()  # Cópia da imagem original
    img = letterbox(image_np, new_shape=640)[0]  # Redimensionamento da imagem
    img = img.transpose((2, 0, 1))[::-1]  # Reorganiza os canais
    img = np.ascontiguousarray(img)  # Torna a imagem contígua na memória
    img = torch.from_numpy(img).to(device).float() / 255.0  # Normaliza para intervalo [0, 1]
    img = img.unsqueeze(0)  # Adiciona uma dimensão para o batch

    with torch.no_grad():  # Desliga o cálculo do gradiente para otimização
        pred = model_v5(img, augment=False, visualize=False)  # Faz a predição
        pred = non_max_suppression(pred, conf_thres=0.25, iou_thres=0.45)[0]  # Aplica NMS

    results = []
    if pred is not None and len(pred):
        pred[:, :4] = scale_coords(img.shape[2:], pred[:, :4], img0.shape).round()  # Ajusta as coordenadas para a escala original da imagem

        for *xyxy, conf, cls in pred:  # Loop sobre as caixas detectadas
            # Filtra as detecções com base na confiança e classe
            class_id = int(cls)
            conf = float(conf)
            if conf < 0.3:  # Ajuste do limiar de confiança (simulando o limiar do YOLOv8)
                continue

            # Coleta a caixa e a classe detectada
            x1, y1, x2, y2 = xyxy
            box_coords = [x1.item(), y1.item(), x2.item(), y2.item()]
            results.append({
                "box": box_coords,  # Adiciona a caixa detectada
                "confidence": conf,  # Confiança da detecção
                "class_id": class_id  # Classe detectada
            })

    # Ordena os resultados pela coordenada X (simulando a ordem de leitura da esquerda para a direita)
    results.sort(key=lambda r: r["box"][0])

    # Gera o número detectado a partir das classes ordenadas
    digits = [str(r["class_id"]) for r in results if r["confidence"] >= 0.3]  # Filtra com base na confiança
    number_detected = ''.join(digits)

    # Calcula a confiança média
    avg_conf = sum(r["confidence"] for r in results) / len(results) if results else None

    return {
        "number_detected": number_detected,
        "confidence": float(avg_conf) if avg_conf is not None else None,
        "box": [float(x) for x in results[0]["box"]] if results else None  # Retorna a primeira caixa detectada
    }








def run_yolov8_obb(image_np: np.ndarray):
    results = model_v8.predict(source=image_np, conf=0.3, iou=0.4, device=0 if torch.cuda.is_available() else 'cpu')[0]

    xywhr_boxes = results.obb.xywhr.cpu().numpy()
    confidences = results.obb.conf.cpu().numpy()
    labels = results.obb.cls.cpu().numpy()

    # Converter (x_center, y_center, w, h, rotation) → (x1, y1, x2, y2) para NMS
    boxes_xyxy = []
    valid_indices = []

    for i, (box, conf) in enumerate(zip(xywhr_boxes, confidences)):
        if conf < 0.3:  # CONFIDENCE_THRESHOLD
            continue

        x_c, y_c, w, h, _ = box
        x1 = x_c - w / 2
        y1 = y_c - h / 2
        x2 = x_c + w / 2
        y2 = y_c + h / 2
        boxes_xyxy.append([x1, y1, x2, y2])
        valid_indices.append(i)

    if not boxes_xyxy:
        return {
            "number_detected": "",
            "confidence": None,
            "box": None
        }

    boxes_tensor = torch.tensor(boxes_xyxy, device=device)
    scores_tensor = torch.tensor([confidences[i] for i in valid_indices], device=device)

    # Aplicar NMS usando torchvision.ops.nms
    keep_indices = nms(boxes_tensor, scores_tensor, 0.45)  # IOU_THRESHOLD
    keep_indices = keep_indices.cpu().numpy()

    digits = []
    all_confidences = []
    box_coords = None

    for idx in keep_indices:
        i = valid_indices[idx]
        x_c, y_c, w, h, angle = xywhr_boxes[i]
        class_id = int(labels[i])
        conf = float(confidences[i])

        if class_id == 10:
            x1 = x_c - w / 2
            y1 = y_c - h / 2
            x2 = x_c + w / 2
            y2 = y_c + h / 2
            box_coords = [x1, y1, x2, y2]
        else:
            digits.append((x_c, str(class_id)))
            all_confidences.append(conf)

    # Ordena os dígitos por posição x
    digits.sort()
    number_detected = ''.join([d[1] for d in digits])
    avg_conf = sum(all_confidences) / len(all_confidences) if all_confidences else None

    return {
        "number_detected": number_detected,
        "confidence": float(avg_conf) if avg_conf is not None else None,
        "box": [float(x) for x in box_coords] if box_coords is not None else None
    }
 

def scale_coords(img1_shape, coords, img0_shape, ratio_pad=None):
    if ratio_pad is None:
        gain = min(img1_shape[0] / img0_shape[0], img1_shape[1] / img0_shape[1])
        pad = ((img1_shape[1] - img0_shape[1] * gain) / 2, (img1_shape[0] - img0_shape[0] * gain) / 2)
    else:
        gain = ratio_pad[0][0]
        pad = ratio_pad[1]

    coords[:, [0, 2]] -= pad[0]
    coords[:, [1, 3]] -= pad[1]
    coords[:, :4] /= gain
    coords[:, 0].clamp_(0, img0_shape[1])
    coords[:, 1].clamp_(0, img0_shape[0])
    coords[:, 2].clamp_(0, img0_shape[1])
    coords[:, 3].clamp_(0, img0_shape[0])
    return coords
