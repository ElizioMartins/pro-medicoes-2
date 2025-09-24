import { Environment } from "./environment.interface";

export const environment: Environment = {
  production: false,
  apiUrl: 'http://localhost:8000',
  appName: 'Pro-Medições',
  version: '1.0.0',
  features: {
    aiDetection: true,
    reports: true,
    notifications: true
  },
  ai: {
    confidenceThreshold: 0.7,
    maxImageSize: 5 * 1024 * 1024, // 5MB
    supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    detectionEndpoint: '/detect/'
  }
};


