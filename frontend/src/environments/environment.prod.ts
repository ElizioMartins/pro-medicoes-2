import { Environment } from "./environment.interface";

export const environment: Environment = {
  production: true,
  apiUrl: "::API_URL::", // Será substituído em build de produção
  appName: "Pro-Medições",
  version: "1.0.0",
  features: {
    aiDetection: true,
    reports: true,
    notifications: true,
  },
  ai: {
    confidenceThreshold: 0.7,
    maxImageSize: 5 * 1024 * 1024, // 5MB
    supportedFormats: ["image/jpeg", "image/png", "image/webp"],
  },
};


