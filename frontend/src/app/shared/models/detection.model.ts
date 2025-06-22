import { ApiResponse } from "./api-response.model";

export interface DetectionResult {
  number_detected: string;
  confidence: number;
  box?: number[];
  processing_time?: number;
  model_used?: 'yolov5' | 'yolov8' | 'combined';
}

export interface DetectionRequest {
  image: File;
  meter_id?: number;
  manual_override?: boolean;
}

export interface DetectionResponse extends ApiResponse<DetectionResult> {
  reading_id?: number;
  suggestions?: string[];
}


