import { Reading } from "./Reading";

export interface ReadingPhoto {
  id: number;
  readingId: number;
  filePath: string;
  croppedFilePath?: string;
  isCropped?: boolean;
  timestamp?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  
  // Relacionamento
  reading?: Reading;
}
