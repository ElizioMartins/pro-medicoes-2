import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

// Interface para o evento de foto capturada
export interface PhotoCaptureEvent {
  fullImage: string; // base64
  croppedImage: string; // base64
}

@Component({
  selector: 'app-meter-photo-capture',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="meter-photo-capture-container p-4 border rounded-md">
      <div *ngIf="isLoading" class="loading-indicator text-center">
        <p>Inicializando câmera...</p>
        <p class="text-xs text-gray-500">Certifique-se de permitir o acesso à câmera.</p>
        <!-- TODO: Add a spinner or better loading visual -->
      </div>

      <div *ngIf="error" class="error-message text-center text-red-500 p-4 border border-red-300 bg-red-50 rounded-md">
        <p>{{ error }}</p>
        <button (click)="startCamera()" class="mt-2 px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-100">
          Tentar Novamente
        </button>
        <div class="my-2 text-sm text-gray-500">ou</div>
        <label class="cursor-pointer text-blue-600 hover:underline">
          Carregar foto do dispositivo
          <input type="file" accept="image/*" class="hidden" (change)="handleFileUpload($event)">
        </label>
      </div>

      <div [hidden]="isLoading || !!error">
        <div class="relative mb-2" [hidden]="!!capturedImage">
          <video #videoElement autoplay playsinline muted class="w-full h-auto bg-black rounded" style="min-height: 240px;"></video>
          <div #overlayElement class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 h-1/2 border-4 border-blue-500 rounded-md pointer-events-none">
            <!-- Overlay corners (optional visual enhancement) -->
          </div>
        </div>

        <div *ngIf="capturedImage" class="captured-image-preview text-center mb-2">
          <p class="font-semibold mb-1">Prévia da Captura:</p>
          <img [src]="capturedImage" alt="Foto capturada" class="max-w-full h-auto max-h-60 mx-auto border rounded">
          <div *ngIf="croppedImage" class="mt-2">
            <p class="font-semibold mb-1 text-sm">Detalhe Recortado:</p>
            <img [src]="croppedImage" alt="Detalhe recortado" class="max-w-xs h-auto max-h-20 mx-auto border rounded bg-gray-200">
          </div>
        </div>

        <!-- Hidden canvases for processing -->
        <canvas #canvasElement style="display: none;"></canvas>
        <canvas #cropCanvasElement style="display: none;"></canvas>

        <div class="actions text-center space-x-2">
          <button *ngIf="!capturedImage && videoReady" (click)="capturePhoto()" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Capturar Foto
          </button>
          <button *ngIf="capturedImage" (click)="retakePhoto()" class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100">
            Nova Foto
          </button>
          <button *ngIf="capturedImage" (click)="acceptPhoto()" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
            Usar Esta Foto
          </button>
          <button (click)="closeCapture.emit()" class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100">
            Fechar
          </button>
        </div>
      </div>
    </div>
  `
})
export class MeterPhotoCaptureAngularComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cropCanvasElement') cropCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('overlayElement') overlayRef!: ElementRef<HTMLDivElement>;

  @Output() photoCaptured = new EventEmitter<PhotoCaptureEvent>();
  @Output() closeCapture = new EventEmitter<void>(); // Renamed from 'close' to avoid conflict

  isLoading = true;
  error: string | null = null;
  videoReady = false;
  capturedImage: string | null = null;
  croppedImage: string | null = null;

  private stream: MediaStream | null = null;

  constructor() {}

  ngOnInit(): void {
    this.startCamera();
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  async startCamera(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    this.videoReady = false;
    this.capturedImage = null;
    this.croppedImage = null;

    try {
      if (this.stream) { // Stop existing stream before starting a new one
        this.stopCamera();
      }
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (this.videoRef?.nativeElement) {
        this.videoRef.nativeElement.srcObject = this.stream;
        this.videoRef.nativeElement.onloadeddata = () => {
          this.videoReady = true;
          this.isLoading = false;
          this.videoRef.nativeElement.play().catch(err => {
            console.error('Error playing video:', err);
            this.handleCameraError(err, 'Erro ao iniciar a reprodução do vídeo.');
          });
        };
      } else {
        throw new Error('Elemento de vídeo não encontrado após um pequeno atraso.');
      }
    } catch (err) {
        this.handleCameraError(err);
    }
  }

  private handleCameraError(err: any, defaultMessage = 'Não foi possível acessar a câmera. Verifique as permissões do navegador.'): void {
    console.error('Erro ao acessar a câmera:', err);
    let message = defaultMessage;
    if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            message = 'Permissão para câmera negada. Por favor, permita o acesso à câmera nas configurações do navegador.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            message = 'Nenhuma câmera foi encontrada no dispositivo.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            message = 'Não foi possível iniciar a câmera. Pode estar sendo usada por outro aplicativo.';
        }
    }
    this.error = message;
    this.isLoading = false;
    this.stopCamera(); // Ensure camera is off if an error occurs
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoRef?.nativeElement) {
      this.videoRef.nativeElement.srcObject = null;
    }
    this.videoReady = false;
  }

  capturePhoto(): void {
    if (!this.videoReady || !this.videoRef?.nativeElement || !this.canvasRef?.nativeElement || !this.cropCanvasRef?.nativeElement || !this.overlayRef?.nativeElement) {
      this.error = 'Componente da câmera não está pronto.';
      return;
    }

    const video = this.videoRef.nativeElement;
    const canvas = this.canvasRef.nativeElement;
    const cropCanvas = this.cropCanvasRef.nativeElement;
    const overlay = this.overlayRef.nativeElement;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) { this.error = 'Erro ao obter contexto do canvas.'; return; }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const fullImageBase64 = canvas.toDataURL('image/jpeg');

    const videoRect = video.getBoundingClientRect();
    const overlayRect = overlay.getBoundingClientRect();

    const scaleX = video.videoWidth / videoRect.width;
    const scaleY = video.videoHeight / videoRect.height;

    const cropX = (overlayRect.left - videoRect.left) * scaleX;
    const cropY = (overlayRect.top - videoRect.top) * scaleY;
    const cropWidth = overlayRect.width * scaleX;
    const cropHeight = overlayRect.height * scaleY;
    
    if (cropWidth <= 0 || cropHeight <= 0) {
        this.error = "Dimensões de recorte inválidas. A sobreposição está fora da área do vídeo?";
        return;
    }

    cropCanvas.width = cropWidth;
    cropCanvas.height = cropHeight;
    const cropCtx = cropCanvas.getContext('2d');
    if (!cropCtx) { this.error = 'Erro ao obter contexto do canvas de recorte.'; return; }
    cropCtx.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
    const croppedImageBase64 = cropCanvas.toDataURL('image/jpeg');

    this.capturedImage = fullImageBase64;
    this.croppedImage = croppedImageBase64;
    this.stopCamera(); // Stop camera after capture to show preview
  }

  retakePhoto(): void {
    this.capturedImage = null;
    this.croppedImage = null;
    this.startCamera();
  }

  acceptPhoto(): void {
    if (this.capturedImage && this.croppedImage) {
      this.photoCaptured.emit({ fullImage: this.capturedImage, croppedImage: this.croppedImage });
    } else {
      this.error = "Nenhuma foto capturada para aceitar.";
    }
  }

  handleFileUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (!this.canvasRef?.nativeElement || !this.cropCanvasRef?.nativeElement) return;
        const canvas = this.canvasRef.nativeElement;
        const cropCanvas = this.cropCanvasRef.nativeElement;

        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        this.capturedImage = canvas.toDataURL('image/jpeg');

        // Simplified crop for uploaded images (e.g., center 60% width, 40% height)
        const cropW = img.width * 0.8; // Larger crop area
        const cropH = img.height * 0.5;
        const cropX = (img.width - cropW) / 2;
        const cropY = (img.height - cropH) / 2;

        cropCanvas.width = cropW;
        cropCanvas.height = cropH;
        const cropCtx = cropCanvas.getContext('2d');
        if (!cropCtx) return;
        cropCtx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
        this.croppedImage = cropCanvas.toDataURL('image/jpeg');
        
        this.error = null; // Clear any previous camera errors
        this.isLoading = false; // Ensure loading is false
        this.videoReady = false; // Video stream is not active for uploaded files
        this.stopCamera(); // Ensure camera is off
      };
      img.onerror = () => {
        this.error = "Não foi possível carregar o arquivo de imagem selecionado.";
        this.isLoading = false;
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
        this.error = "Erro ao ler o arquivo.";
        this.isLoading = false;
    };
    reader.readAsDataURL(file);
    input.value = ''; // Reset file input
  }

  // Ensure camera stops if component is hidden without being destroyed (e.g. in a dialog)
  @HostListener('window:visibilitychange')
  onVisibilityChange(): void {
    if (document.hidden) {
      // Potentially stop camera if app wants to save resources,
      // but this might be too aggressive. For now, let ngOnDestroy handle it.
    }
  }
}
