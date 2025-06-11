export interface ReadingPhoto {
  id: string;
  readingId: number;
  filePath: string; // Path to the full image
  croppedFilePath?: string; // Path to the cropped image
  isCropped?: boolean; // From React code, seems useful
  timestamp?: Date; // Timestamp of when the photo was taken
}
