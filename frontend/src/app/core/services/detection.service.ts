import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '@environments/environment';

export interface DetectionResponse {
  number_detected?: number | null;
  confidence?: number;
  success?: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DetectionService {
  private readonly http = inject(HttpClient);
  private readonly detectionUrl = `${environment.apiUrl}${environment.ai.detectionEndpoint}`;

  /**
   * Detecta números em uma imagem usando IA
   * @param base64Image String base64 da imagem
   * @returns Observable com o resultado da detecção
   */
  detectFromBase64Image(base64Image: string): Observable<DetectionResponse> {
    try {
      const imageBlob = this.base64ToBlob(base64Image);
      const formData = new FormData();
      formData.append('file', imageBlob, 'image.jpg');

      return this.http.post<DetectionResponse>(this.detectionUrl, formData)
        .pipe(
          catchError(this.handleError)
        );
    } catch (error) {
      console.error('Erro ao preparar imagem para detecção:', error);
      return throwError(() => new Error(`Erro ao processar imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`));
    }
  }

  /**
   * Detecta números em um arquivo de imagem
   * @param file Arquivo de imagem
   * @returns Observable com o resultado da detecção
   */
  detectFromFile(file: File): Observable<DetectionResponse> {
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return throwError(() => new Error('Por favor, selecione apenas arquivos de imagem.'));
    }

    // Validar tamanho do arquivo
    if (file.size > environment.ai.maxImageSize) {
      const maxSizeMB = environment.ai.maxImageSize / (1024 * 1024);
      return throwError(() => new Error(`Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB.`));
    }

    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<DetectionResponse>(this.detectionUrl, formData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Converte string base64 para Blob
   * @param base64 String base64
   * @param contentType Tipo do conteúdo (padrão: image/jpeg)
   * @returns Blob
   */
  private base64ToBlob(base64: string, contentType = 'image/jpeg'): Blob {
    try {
      const byteCharacters = atob(base64.split(',')[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: contentType });
    } catch (e) {
      console.error('Erro ao converter base64 para Blob:', e);
      throw new Error('String base64 inválida para conversão de imagem.');
    }
  }

  /**
   * Trata erros HTTP
   * @param error Erro HTTP
   * @returns Observable com erro tratado
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'Erro na detecção OCR.';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.error?.detail) {
      errorMessage = error.error.detail;
    } else if (error.message) {
      errorMessage = `Erro na detecção OCR (${error.status}): ${error.message}`;
    }

    console.error('Erro na detecção:', error);
    return throwError(() => new Error(errorMessage));
  };
}