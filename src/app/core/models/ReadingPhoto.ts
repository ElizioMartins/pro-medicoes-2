export interface ReadingPhoto {
  id: string;
  readingId: string;
  filePath: string; // Path to the full image
  croppedFilePath?: string; // Path to the cropped image
  isCropped?: boolean; // From React code, seems useful
  // Add any other relevant metadata, e.g., timestamp
}
