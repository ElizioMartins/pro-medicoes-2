import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpErrorResponse, HttpClientModule } from '@angular/common/http';
import { of, switchMap, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { trigger, style, animate, transition } from '@angular/animations';

import { MeterPhotoCaptureAngularComponent, PhotoCaptureEvent } from '@shared/components/meter-photo-capture/meter-photo-capture.component';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { Reading, ReadingCreate } from '@app/shared/models/reading.model';
import { ReadingStatus } from '@app/shared/models/enums';
import { ReadingService } from '@app/core/services/reading.service';
import { DetectionService, DetectionResponse } from '@core/services/detection.service';
import { ApiResponse } from '@shared/models/api-response.model';
import { UnitService } from '@core/services/Unit.service';
import { MeasurementTypeService } from '@core/services/measurementtype.service';
import { Unit } from '@shared/models/unit.model';
import { MeasurementType } from '@shared/models/measurement-type.model';

interface UnitListResponse {
  units: Unit[];
  total: number;
  skip: number;
  limit: number;
}

@Component({
  selector: 'app-reading-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    HttpClientModule,
    MeterPhotoCaptureAngularComponent,
    CardComponent,
    ButtonComponent,
    InputComponent
  ],
  templateUrl: './reading-form.component.html',
  styleUrls: ['./reading-form.component.scss'],
  animations: [
    trigger('fade', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class ReadingFormComponent implements OnInit, OnDestroy {
  readingForm: FormGroup;
  showPhotoCaptureModal = false;
  capturedFullImage: string | null = null;
  capturedCroppedImage: string | null = null;
  isDetecting = false;
  detectionError: string | null = null;
  currentReadingIdFromRoute: number | null = null;
  currentReading: Reading | null = null;
  isSaving = false;
  isLoading = false;
  loadError: string | null = null;
  private newPhotoTaken = false;
  private destroy$ = new Subject<void>();

  // Upload photo properties
  uploadedFullImage: string | null = null;
  uploadedCroppedImage: string | null = null;
  isUploadDetecting = false;
  uploadDetectionError: string | null = null;
  private newPhotoUploaded = false;

  // Context information for new readings
  contextMeterId: number | null = null;
  contextUnitId: number | null = null;
  contextCondominiumId: number | null = null;
  contextMeasurementTypeId: number | null = null;

  // Available options for selects
  availableUnits: Unit[] = [];
  availableMeasurementTypes: MeasurementType[] = [];

  // Injeção moderna de dependências
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private readingService = inject(ReadingService);
  private detectionService = inject(DetectionService);
  private unitService = inject(UnitService);
  private measurementTypeService = inject(MeasurementTypeService);

  constructor() {
    this.readingForm = this.fb.group({
      currentReading: [''],
      referenceMonth: ['', Validators.required], // Formato YYYY-MM
      inaccessible: [false],
      inaccessibleReason: [{ value: '', disabled: true }],
      notes: ['']
    });

    // Inicializar com o mês atual por padrão
    const currentDate = new Date();
    const currentMonth = currentDate.toISOString().slice(0, 7); // YYYY-MM
    this.readingForm.patchValue({
      referenceMonth: currentMonth
    });

    // Configurar validações condicionais
    this.setupConditionalValidations();

    // Monitora mudanças no campo inaccessible
    this.readingForm.get('inaccessible')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(isInaccessible => {
        this.toggleInaccessibleFields(isInaccessible);
        this.updateValidations();
      });
  }

  private setupConditionalValidations(): void {
    // Configurar validações iniciais
    this.updateValidations();
  }

  private updateValidations(): void {
    const currentReadingControl = this.readingForm.get('currentReading');
    const inaccessibleReasonControl = this.readingForm.get('inaccessibleReason');
    const isInaccessible = this.readingForm.get('inaccessible')?.value;

    if (isInaccessible) {
      // Se inacessível, não precisa de leitura atual, mas precisa de motivo
      currentReadingControl?.clearValidators();
      inaccessibleReasonControl?.setValidators([Validators.required]);
    } else {
      // Se acessível, precisa de leitura atual válida
      currentReadingControl?.setValidators([
        Validators.required,
        Validators.pattern('^[0-9]*[.]?[0-9]+$')
      ]);
      inaccessibleReasonControl?.clearValidators();
    }

    // Atualizar validade dos controles
    currentReadingControl?.updateValueAndValidity();
    inaccessibleReasonControl?.updateValueAndValidity();
  }

  private isFormValid(): boolean {
    const formValue = this.readingForm.getRawValue();
    const isInaccessible = formValue.inaccessible;

    // Validações obrigatórias
    if (!formValue.referenceMonth) {
      return false;
    }

    if (isInaccessible) {
      // Se inacessível, deve ter motivo
      return !!formValue.inaccessibleReason?.trim();
    } else {
      // Se acessível, deve ter leitura atual válida
      const reading = formValue.currentReading?.trim();
      if (!reading) {
        return false;
      }
      
      // Validar formato numérico
      const numberRegex = /^[0-9]*[.]?[0-9]+$/;
      return numberRegex.test(reading);
    }
  }

  private showValidationErrors(): void {
    const formValue = this.readingForm.getRawValue();
    const isInaccessible = formValue.inaccessible;
    const errors: string[] = [];

    // Verificar mês de referência
    if (!formValue.referenceMonth) {
      errors.push('Mês de referência é obrigatório');
    }

    if (isInaccessible) {
      // Validações para leitura inacessível
      if (!formValue.inaccessibleReason?.trim()) {
        errors.push('Motivo da inacessibilidade é obrigatório');
      }
    } else {
      // Validações para leitura normal
      if (!formValue.currentReading?.trim()) {
        errors.push('Valor da leitura atual é obrigatório');
      } else {
        const numberRegex = /^[0-9]*[.]?[0-9]+$/;
        if (!numberRegex.test(formValue.currentReading)) {
          errors.push('Valor da leitura deve ser um número válido (ex: 123.45)');
        }
      }
    }

    if (errors.length > 0) {
      const errorMessage = 'Erro de validação:\n\n' + errors.join('\n');
      alert(errorMessage);
    }
  }

  get canSubmitForm(): boolean {
    return this.readingForm.valid && this.isFormValid() && !this.isDetecting && !this.isSaving;
  }

  ngOnInit(): void {
    // Verificar se é criação ou edição
    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        switchMap(params => {
          const id = params.get('id');
          if (id) {
            // Modo de edição
            this.currentReadingIdFromRoute = parseInt(id);
            this.isLoading = true;
            return this.readingService.getReadingById(this.currentReadingIdFromRoute);
          } else {
            // Modo de criação - verificar query parameters
            this.handleNewReadingParams();
            return of(undefined);
          }
        })
      )
      .subscribe({
        next: reading => {
          if (reading) {
            // Carregando leitura existente
            this.currentReading = reading;
            this.readingForm.patchValue({
              currentReading: reading.current_reading || '',
              referenceMonth: reading.reference_month || '',
              inaccessible: reading.status === 'INACCESSIBLE',
              inaccessibleReason: reading.inaccessible_reason || '',
              notes: reading.observations || ''
            });
            
            if (reading.status === 'INACCESSIBLE') {
              this.toggleInaccessibleFields(true);
            }
            
            if (reading.photos && reading.photos.length > 0) {
              // Carregaria a foto do servidor em produção
              this.capturedFullImage = reading.photos[0].filePath;
              this.capturedCroppedImage = reading.photos[0].photo_path || null;
            }
            
            this.isLoading = false;
          } else if (this.currentReadingIdFromRoute) {
            // Leitura não encontrada
            this.loadError = `Leitura com ID ${this.currentReadingIdFromRoute} não encontrada.`;
            this.isLoading = false;
          }
        },
        error: err => {
          console.error('Erro ao carregar dados da leitura:', err);
          this.loadError = 'Erro ao carregar dados da leitura.';
          this.isLoading = false;
        }
      });
  }

  private handleNewReadingParams(): void {
    // Pegar parâmetros para criação de nova leitura
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['meterId']) {
          console.log('[DEBUG] Criando nova leitura com contexto:', params);
          // Salvar contexto para usar no salvamento
          this.contextMeterId = parseInt(params['meterId']);
          this.contextUnitId = params['unitId'] ? parseInt(params['unitId']) : null;
          this.contextCondominiumId = params['condominiumId'] ? parseInt(params['condominiumId']) : null;
          this.contextMeasurementTypeId = params['measurementTypeId'] ? parseInt(params['measurementTypeId']) : null;
          
          // Inicializar opções dos selects (dados mock por enquanto)
          this.initializeSelectOptions();
        }
      });
  }

  private initializeSelectOptions(): void {
    // Carregar unidades do condomínio
    if (this.contextCondominiumId) {
      this.unitService.getUnitsByCondominiumId(this.contextCondominiumId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: UnitListResponse) => {
            this.availableUnits = response.units || [];
          },
          error: (error: HttpErrorResponse) => {
            console.error('Erro ao carregar unidades:', error);
            this.availableUnits = [];
          }
        });
    }

    // Carregar tipos de medição
    this.measurementTypeService.getMeasurementTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types: MeasurementType[]) => {
          this.availableMeasurementTypes = types;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Erro ao carregar tipos de medição:', error);
          this.availableMeasurementTypes = [];
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private toggleInaccessibleFields(isInaccessible: boolean): void {
    const currentReadingControl = this.readingForm.get('currentReading');
    const inaccessibleReasonControl = this.readingForm.get('inaccessibleReason');

    if (isInaccessible) {
      currentReadingControl?.setValue('');
      currentReadingControl?.disable();
      inaccessibleReasonControl?.enable();
      inaccessibleReasonControl?.setValidators(Validators.required);
      // Limpa foto e estado de detecção se a unidade ficar inacessível
      this.capturedFullImage = null;
      this.capturedCroppedImage = null;
      this.newPhotoTaken = false;
      this.detectionError = null;
    } else {
      currentReadingControl?.enable();
      inaccessibleReasonControl?.setValue('');
      inaccessibleReasonControl?.disable();
      inaccessibleReasonControl?.clearValidators();
    }
    currentReadingControl?.updateValueAndValidity();
    inaccessibleReasonControl?.updateValueAndValidity();
  }

  triggerPhotoCaptureModal(): void {
    this.showPhotoCaptureModal = true;
  }

  onClosePhotoCaptureModal(): void {
    this.showPhotoCaptureModal = false;
  }

  onPhotoSuccessfullyCaptured(event: PhotoCaptureEvent): void {
    this.capturedFullImage = event.fullImage;
    this.capturedCroppedImage = event.croppedImage;
    this.newPhotoTaken = true;
    this.showPhotoCaptureModal = false;
    this.detectionError = null;
    if (this.capturedCroppedImage && !this.readingForm.get('inaccessible')?.value) {
      this.detectReadingValue(this.capturedCroppedImage);
    }
  }

  /**
   * Detecta o valor da leitura usando o serviço de detecção
   * @param base64Image Imagem em base64
   */
  private detectReadingValue(base64Image: string): void {
    this.isDetecting = true;
    this.detectionError = null;

    this.detectionService.detectFromBase64Image(base64Image)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: DetectionResponse) => {
          if (response && response.number_detected !== undefined && response.number_detected !== null) {
            this.readingForm.get('currentReading')?.setValue(response.number_detected);
            this.detectionError = null;
          } else {
            this.detectionError = 'Valor não detectado claramente. Insira manualmente.';
          }
          this.isDetecting = false;
        },
        error: (error: Error) => {
          console.error('Erro na detecção OCR:', error);
          this.detectionError = error.message || 'Erro na detecção OCR. Tente novamente ou insira manualmente.';
          this.isDetecting = false;
        }
      });
  }

  // Upload photo methods
  onPhotoUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    
    // Usar o serviço de detecção para validar e detectar
    this.isUploadDetecting = true;
    this.uploadDetectionError = null;

    // Primeiro, ler o arquivo como base64 para exibir
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const base64 = e.target?.result as string;
      this.uploadedFullImage = base64;
      this.uploadedCroppedImage = base64; // Para upload, usamos a mesma imagem
      this.newPhotoUploaded = true;
      
      // Detectar valor na imagem carregada usando o serviço
      if (!this.readingForm.get('inaccessible')?.value) {
        this.detectFromUploadedFile(file);
      } else {
        this.isUploadDetecting = false;
      }
    };
    
    reader.onerror = () => {
      this.uploadDetectionError = 'Erro ao carregar o arquivo de imagem.';
      this.isUploadDetecting = false;
    };
    
    reader.readAsDataURL(file);
    
    // Reset input value to allow same file to be selected again
    input.value = '';
  }

  /**
   * Detecta valor da leitura a partir de arquivo enviado
   * @param file Arquivo de imagem
   */
  private detectFromUploadedFile(file: File): void {
    this.detectionService.detectFromFile(file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: DetectionResponse) => {
          if (response && response.number_detected !== undefined && response.number_detected !== null) {
            this.readingForm.get('currentReading')?.setValue(response.number_detected);
            this.uploadDetectionError = null;
          } else {
            this.uploadDetectionError = 'Valor não detectado claramente. Insira manualmente.';
          }
          this.isUploadDetecting = false;
        },
        error: (error: Error) => {
          console.error('Erro na detecção OCR da imagem carregada:', error);
          this.uploadDetectionError = error.message || 'Erro na detecção OCR. Tente novamente ou insira manualmente.';
          this.isUploadDetecting = false;
        }
      });
  }

  /**
   * Converte string base64 para Blob (método auxiliar)
   * @param base64 String base64
   * @param contentType Tipo do conteúdo
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

  removeUploadedPhoto(): void {
    this.uploadedFullImage = null;
    this.uploadedCroppedImage = null;
    this.newPhotoUploaded = false;
    this.uploadDetectionError = null;
    this.isUploadDetecting = false;
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('photoUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onSubmit(): void {
    console.log('[DEBUG] onSubmit iniciado');
    console.log('[DEBUG] Form valid:', this.readingForm.valid);
    console.log('[DEBUG] Form value:', this.readingForm.getRawValue());
    console.log('[DEBUG] Context meterId:', this.contextMeterId);
    console.log('[DEBUG] Current reading ID:', this.currentReadingIdFromRoute);
    
    // Marcar todos os campos como tocados para exibir erros
    this.readingForm.markAllAsTouched();
    
    // Validações personalizadas
    if (!this.isFormValid()) {
      console.error('Formulário inválido - validações personalizadas falharam');
      this.showValidationErrors();
      return;
    }
    
    // Validação do Angular Forms
    if (this.readingForm.invalid) {
      console.error('Formulário inválido - validações do Angular falharam');
      this.showValidationErrors();
      return;
    }

    // Validar se é nova leitura e não tem meterId
    if (!this.currentReadingIdFromRoute && !this.contextMeterId) {
      alert('Erro: ID do medidor não encontrado. Retorne à lista de leituras e tente novamente.');
      console.error('MeterId é obrigatório para criar nova leitura');
      return;
    }

    this.isSaving = true;
    const formValue = this.readingForm.getRawValue();

    let status: Reading['status'];
    if (formValue.inaccessible) {
      status = ReadingStatus.INACCESSIBLE;
    } else if (formValue.currentReading && (this.capturedCroppedImage || this.uploadedCroppedImage)) {
      status = ReadingStatus.COMPLETED;
    } else {
      status = ReadingStatus.PENDING;
    }

    console.log('[DEBUG] Status determinado:', status);

    try {
      let operation$: Observable<ApiResponse<Reading>>;

      if (this.currentReadingIdFromRoute) {
        // Atualizando leitura existente
        const readingPayload: Partial<Reading> = {
          current_reading: formValue.inaccessible ? null : formValue.currentReading,
          reference_month: formValue.referenceMonth,
          observations: formValue.notes,
          status,
          inaccessible_reason: formValue.inaccessible ? formValue.inaccessibleReason : null,
          date: new Date().toISOString()
        };
        console.log('[DEBUG] Update payload:', readingPayload);
        operation$ = this.readingService.updateReading(this.currentReadingIdFromRoute, readingPayload);
      } else {
        // Criando nova leitura
        const createPayload: ReadingCreate = {
          meter_id: this.contextMeterId!,
          current_reading: formValue.inaccessible ? '' : formValue.currentReading,
          reference_month: formValue.referenceMonth,
          status,
          inaccessible_reason: formValue.inaccessible ? formValue.inaccessibleReason : undefined,
          observations: formValue.notes || undefined
        };
        console.log('[DEBUG] Create payload:', createPayload);
        operation$ = this.readingService.create(createPayload);
      }

      console.log('[DEBUG] Operação definida:', this.currentReadingIdFromRoute ? 'update' : 'create');

      // Executar a operação principal primeiro
      operation$
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (reading) => {
            console.log('[DEBUG] Sucesso:', this.currentReadingIdFromRoute ? 'Leitura atualizada:' : 'Leitura criada:', reading);
            
            // Debug das variáveis de foto
            console.log('[DEBUG] Estado das fotos:');
            console.log('[DEBUG] - newPhotoTaken:', this.newPhotoTaken);
            console.log('[DEBUG] - capturedFullImage:', !!this.capturedFullImage);
            console.log('[DEBUG] - capturedCroppedImage:', !!this.capturedCroppedImage);
            console.log('[DEBUG] - newPhotoUploaded:', this.newPhotoUploaded);
            console.log('[DEBUG] - uploadedFullImage:', !!this.uploadedFullImage);
            console.log('[DEBUG] - uploadedCroppedImage:', !!this.uploadedCroppedImage);
            
            // Se temos foto para salvar, salvar agora que temos o ID da leitura
            const hasPhotoToSave = (this.newPhotoTaken && this.capturedFullImage && this.capturedCroppedImage) ||
                                   (this.newPhotoUploaded && this.uploadedFullImage && this.uploadedCroppedImage);
            
            console.log('[DEBUG] - hasPhotoToSave:', hasPhotoToSave);
            console.log('[DEBUG] - reading:', reading);
            console.log('[DEBUG] - reading.data:', reading.data);
            console.log('[DEBUG] - reading.id (direct):', (reading as unknown as Reading).id);
            
            // Tentar acessar o ID de diferentes formas
            const readingId = reading.data?.id || (reading as unknown as Reading).id;
            console.log('[DEBUG] - readingId final:', readingId);
            
            if (hasPhotoToSave && readingId) {
              console.log('[DEBUG] Salvando foto para leitura ID:', readingId);
              this.savePhotoForReading(readingId);
            } else {
              console.log('[DEBUG] Sem foto para salvar, finalizando processo');
              // Sem foto para salvar, finalizar processo
              this.finalizeSaveProcess();
            }
          },
          error: (err) => {
            console.error('[DEBUG] Erro ao salvar leitura:', err);
            this.isSaving = false;
            
            let errorMessage = 'Erro desconhecido';
            if (err.error?.detail) {
              errorMessage = err.error.detail;
            } else if (err.error?.message) {
              errorMessage = err.error.message;
            } else if (err.message) {
              errorMessage = err.message;
            }
            
            alert(`Erro ao salvar leitura: ${errorMessage}`);
          }
        });
    } catch (error) {
      console.error('[DEBUG] Erro na preparação do onSubmit:', error);
      this.isSaving = false;
      alert('Erro inesperado ao preparar o salvamento da leitura');
    }
  }

  /**
   * Salva a foto para uma leitura específica
   */
  private savePhotoForReading(readingId: number): void {
    console.log('[DEBUG] savePhotoForReading iniciado para ID:', readingId);
    
    const formData = new FormData();
    
    // Use captured photo if available, otherwise use uploaded photo
    if (this.newPhotoTaken && this.capturedFullImage && this.capturedCroppedImage) {
      console.log('[DEBUG] Usando fotos capturadas');
      try {
        const fullImageBlob = this.base64ToBlob(this.capturedFullImage);
        const croppedImageBlob = this.base64ToBlob(this.capturedCroppedImage);
        console.log('[DEBUG] Blobs criados - Full:', fullImageBlob.size, 'bytes, Cropped:', croppedImageBlob.size, 'bytes');
        formData.append('file', fullImageBlob, 'captured-full.jpg');
        formData.append('cropped_file', croppedImageBlob, 'captured-cropped.jpg');
      } catch (error) {
        console.error('[DEBUG] Erro ao criar blobs das fotos capturadas:', error);
        this.finalizeSaveProcess();
        return;
      }
    } else if (this.newPhotoUploaded && this.uploadedFullImage && this.uploadedCroppedImage) {
      console.log('[DEBUG] Usando fotos carregadas');
      try {
        const fullImageBlob = this.base64ToBlob(this.uploadedFullImage);
        const croppedImageBlob = this.base64ToBlob(this.uploadedCroppedImage);
        console.log('[DEBUG] Blobs criados - Full:', fullImageBlob.size, 'bytes, Cropped:', croppedImageBlob.size, 'bytes');
        formData.append('file', fullImageBlob, 'uploaded-full.jpg');
        formData.append('cropped_file', croppedImageBlob, 'uploaded-cropped.jpg');
      } catch (error) {
        console.error('[DEBUG] Erro ao criar blobs das fotos carregadas:', error);
        this.finalizeSaveProcess();
        return;
      }
    } else {
      console.log('[DEBUG] Nenhuma foto encontrada para salvar');
      this.finalizeSaveProcess();
      return;
    }
    
    console.log('[DEBUG] FormData criado, enviando requisição...');
    
    this.readingService.saveReadingPhoto(readingId, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (photoResponse) => {
          console.log('[DEBUG] Foto salva:', photoResponse);
          
          // Se houve detecção automática, atualizar o campo de leitura
          if (photoResponse.detection?.number_detected) {
            console.log('[DEBUG] Detecção automática:', photoResponse.detection);
            
            // Atualizar o campo de leitura atual se ainda não foi preenchido
            const currentReadingValue = this.readingForm.get('currentReading')?.value;
            if (!currentReadingValue || currentReadingValue === '') {
              this.readingForm.get('currentReading')?.setValue(photoResponse.detection.number_detected);
              console.log('[DEBUG] Campo de leitura atualizado automaticamente:', photoResponse.detection.number_detected);
            }
            
            // Mostrar informação da detecção para o usuário
            const confidence = Math.round(photoResponse.detection.confidence * 100);
            alert(`Foto salva com sucesso! Número detectado automaticamente: ${photoResponse.detection.number_detected} (confiança: ${confidence}%)`);
          } else {
            alert('Foto salva com sucesso!');
          }
          
          this.finalizeSaveProcess();
        },
        error: (err) => {
          console.error('[DEBUG] Erro ao salvar foto:', err);
          console.error('[DEBUG] Status do erro:', err.status);
          console.error('[DEBUG] Mensagem do erro:', err.error);
          console.error('[DEBUG] Detalhes completos do erro:', err);
          
          let errorMessage = 'Erro desconhecido ao salvar foto';
          if (err.error?.detail) {
            errorMessage = err.error.detail;
          } else if (err.error?.message) {
            errorMessage = err.error.message;
          } else if (err.message) {
            errorMessage = err.message;
          }
          
          // Mesmo com erro na foto, continuar o processo pois a leitura já foi salva
          alert(`Leitura salva, mas houve erro ao salvar a foto: ${errorMessage}`);
          this.finalizeSaveProcess();
        }
      });
  }

  /**
   * Finaliza o processo de salvamento
   */
  private finalizeSaveProcess(): void {
    this.isSaving = false;
    this.newPhotoTaken = false;
    this.newPhotoUploaded = false;
    
    if (this.currentReadingIdFromRoute) {
      // Se está editando uma leitura existente, volta para a lista
      this.router.navigate(['/readings']);
    } else {
      // Se está criando uma nova leitura, limpa o formulário e permanece na tela
      this.resetFormForNewReading();
      // Mostrar mensagem de sucesso
      alert('Leitura salva com sucesso! Você pode registrar uma nova leitura.');
    }
  }

  /**
   * Reseta o formulário para uma nova leitura, mantendo apenas os dados de contexto
   */
  private resetFormForNewReading(): void {
    // Limpar dados do formulário
    this.readingForm.patchValue({
      currentReading: '',
      inaccessible: false,
      inaccessibleReason: '',
      notes: ''
    });

    // Limpar fotos
    this.capturedFullImage = null;
    this.capturedCroppedImage = null;
    this.uploadedFullImage = null;
    this.uploadedCroppedImage = null;
    
    // Resetar estados de detecção e foto
    this.newPhotoTaken = false;
    this.newPhotoUploaded = false;
    this.isDetecting = false;
    this.isUploadDetecting = false;
    this.detectionError = null;
    this.uploadDetectionError = null;
    
    // Limpar dados da leitura atual (para que seja tratado como nova leitura)
    this.currentReading = null;
    this.currentReadingIdFromRoute = null;
    
    // Reabilitar campos se necessário
    this.toggleInaccessibleFields(false);
    
    // Marcar formulário como pristine
    this.readingForm.markAsUntouched();
    this.readingForm.markAsPristine();
    
    console.log('[DEBUG] Formulário resetado para nova leitura. Contexto mantido:', {
      meterId: this.contextMeterId,
      unitId: this.contextUnitId,
      condominiumId: this.contextCondominiumId,
      measurementTypeId: this.contextMeasurementTypeId
    });
  }
}

