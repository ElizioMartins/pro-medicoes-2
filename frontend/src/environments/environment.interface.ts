export interface Environment {
  production: boolean;
  apiUrl: string;
  appName: string;
  version: string;
  features: {
    aiDetection: boolean;
    reports: boolean;
    notifications: boolean;
  };
  ai: {
    confidenceThreshold: number;
    maxImageSize: number;
    supportedFormats: string[];
  };
}


