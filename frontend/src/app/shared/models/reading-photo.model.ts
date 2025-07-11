import { BaseEntity } from "./base.model";

export interface ReadingPhoto extends BaseEntity {
  reading_id: number;
  photo_path: string;
  filePath: string;
  croppedFilePath?: string;
  ai_reading_value?: number;
  ai_confidence?: number;
  ai_processed_at?: string;
  active: boolean;
}

export interface ReadingPhotoCreate {
  reading_id: number;
  photo_path: string;
  filePath: string;
  croppedFilePath?: string;
  ai_reading_value?: number;
  ai_confidence?: number;
  active?: boolean;
}
