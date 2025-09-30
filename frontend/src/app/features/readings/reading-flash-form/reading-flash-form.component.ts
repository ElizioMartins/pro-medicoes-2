import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, finalize, switchMap, of } from 'rxjs';

// Components
import { MeterPhotoCaptureAngularComponent, PhotoCaptureEvent } from '@shared/components/meter-photo-capture/meter-photo-capture.component';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';

// Models
import { Condominium } from '@shared/models/condominium.model';
import { Unit } from '@shared/models/unit.model';
import { Meter } from '@shared/models/meter.model';
import { MeasurementType } from '@shared/models/measurement-type.model';
import { ReadingCreate } from '@shared/models/reading.model';
import { ReadingStatus } from '@shared/models/enums';

// Services
import { CondominiumService } from '@core/services/condominium.service';
import { UnitService } from '@core/services/unit.service';
import { MeterService } from '@core/services/meter.service';
import { MeasurementTypeService } from '@core/services/measurementtype.service';
import { ReadingService } from '@core/services/reading.service';
import { DetectionService, DetectionResponse } from '@core/services/detection.service';
import { ToastService } from '@core/services/toast.service';

interface FlashReadingSession {
  condominium: Condominium;
  measurementType: MeasurementType;
  units: Unit[];
  currentUnitIndex: number;
  currentMeterIndex: number;
  totalReadings: number;
  completedReadings: number;
}

@Component({
  selector: 'app-reading-flash-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MeterPhotoCaptureAngularComponent,
    CardComponent,
    ButtonComponent
  ],
  template: `
    <div class="flash-reading-container">
      <!-- Header com progresso -->
      <app-card class="progress-card">
        <div class="progress-header">
          <h2>Leituras Rápidas</h2>
          <div class="progress-info" *ngIf="session()">
            <span class="progress-text">
              {{ session()!.completedReadings }} de {{ session()!.totalReadings }} leituras
            </span>
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="getProgressPercentage()"></div>
            </div>
          </div>
        </div>
      </app-card>

      <!-- Seleção de Condomínio -->
      <app-card *ngIf="!session()" class="setup-card">
        <h3>Selecionar Condomínio</h3>
        
        <form [formGroup]="setupForm" (ngSubmit)="startFlashReading()">
          <div class="form-group">
            <label for="condominium">Condomínio:</label>
            <select id="condominium" formControlName="condominiumId" class="form-control">
              <option value="">Selecione um condomínio</option>
              <option *ngFor="let condo of condominiums(); trackBy: trackByCondominiumId" [value]="condo.id">
                {{ condo.name }}
              </option>
            </select>
            <div class="form-help" *ngIf="condominiums().length === 0 && !isLoadingSetup()">
              Nenhum condomínio encontrado
            </div>
          </div>

          <div class="form-group">
            <label for="measurementType">Tipo de Medidor:</label>
            <select id="measurementType" formControlName="measurementTypeId" class="form-control">
              <option value="">Selecione o tipo de medidor</option>
              <option *ngFor="let type of measurementTypes(); trackBy: trackByMeasurementTypeId" [value]="type.id">
                {{ type.name }} ({{ type.unit }})
              </option>
            </select>
            <div class="form-help" *ngIf="measurementTypes().length === 0 && !isLoadingSetup()">
              Nenhum tipo de medidor encontrado
            </div>
          </div>
          
          <div class="form-actions">
            <app-button type="submit" variant="primary" [disabled]="!setupForm.valid || isLoadingSetup()">
              <span *ngIf="isLoadingSetup()">Carregando...</span>
              <span *ngIf="!isLoadingSetup()">Iniciar Leituras</span>
            </app-button>
            <app-button type="button" variant="secondary" (click)="close()">
              Cancelar
            </app-button>
          </div>
        </form>
      </app-card>

      <!-- Interface de Leitura Ativa -->
      <div *ngIf="session()" class="reading-session">
        <!-- Informações da leitura atual -->
        <app-card class="current-reading-card">
          <div class="reading-info">
            <h3>{{ session()!.condominium.name }}</h3>
            <div class="unit-info" *ngIf="getCurrentUnit(); else sessionCompleteMsg">
              <span class="unit-number">Unidade: {{ getCurrentUnit()?.number }}</span>
              <span class="meter-info">{{ getCurrentMeter()?.measurement_type?.name || 'Medidor' }}</span>
              <span class="unit-index">📍 {{ session()!.currentUnitIndex + 1 }} de {{ session()!.units.length }}</span>
            </div>
            <ng-template #sessionCompleteMsg>
              <div class="unit-info">
                <span class="completion-message">✅ Todas as unidades foram processadas!</span>
              </div>
            </ng-template>
          </div>
          
          <div class="navigation-controls">
            <app-button 
              variant="secondary" 
              size="sm"
              (click)="previousReading()"
              [disabled]="isFirstReading() || isSessionComplete() || showFinalSummary">
              ← Anterior
            </app-button>
            <app-button 
              variant="secondary" 
              size="sm"
              (click)="skipReading()"
              [disabled]="isSaving() || isSessionComplete() || showFinalSummary">
              Pular
            </app-button>
          </div>
        </app-card>

        <!-- Captura de Foto -->
        <app-card class="photo-capture-card" *ngIf="!showResults && !isSessionComplete() && !showFinalSummary">
          <app-meter-photo-capture
            (photoCaptured)="onPhotoCaptured($event)"
            (closeCapture)="close()">
          </app-meter-photo-capture>
        </app-card>

        <!-- Resultados da detecção -->
        <app-card *ngIf="showResults && !isSessionComplete() && !showFinalSummary" class="results-card">
          <h4>Leitura Detectada</h4>
          <div class="detection-result">
            <div class="detected-value">
              <label for="detectedValue">Valor detectado:</label>
              <input 
                id="detectedValue"
                type="text" 
                [(ngModel)]="detectedValue" 
                class="reading-input"
                [class.confirmed]="isValueConfirmed">
            </div>
            <div class="confidence" *ngIf="detectionConfidence">
              Confiança: {{ detectionConfidence }}%
            </div>
          </div>
          
          <div class="result-actions">
            <app-button 
              variant="primary" 
              (click)="confirmReading()"
              [disabled]="!detectedValue || isSaving()">
              <span *ngIf="isSaving()">Salvando...</span>
              <span *ngIf="!isSaving()">Confirmar e Próxima</span>
            </app-button>
            <app-button 
              variant="secondary" 
              (click)="retakePhoto()">
              Nova Foto
            </app-button>
          </div>
        </app-card>

        <!-- Resumo final -->
        <app-card *ngIf="showFinalSummary || isSessionComplete()" class="summary-card">
          <h3>Leituras Concluídas!</h3>
          <div class="summary-stats">
            <div class="stat">
              <span class="stat-value">{{ session()!.completedReadings }}</span>
              <span class="stat-label">Leituras realizadas</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ getSkippedCount() }}</span>
              <span class="stat-label">Puladas</span>
            </div>
          </div>
          
          <div class="summary-actions">
            <app-button variant="primary" (click)="startNewSession()">
              Nova Sessão
            </app-button>
            <app-button variant="secondary" (click)="close()">
              Fechar
            </app-button>
          </div>
        </app-card>
      </div>

      <!-- Estados de loading e erro -->
      <div *ngIf="error()" class="error-message">
        <p>{{ error() }}</p>
        <app-button variant="secondary" (click)="clearError()">
          Tentar Novamente
        </app-button>
      </div>
    </div>
  `,
  styles: [`
    .flash-reading-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 1rem;
    }

    .progress-card {
      margin-bottom: 1rem;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .progress-header h2 {
      margin: 0;
      color: #1f2937;
    }

    .progress-info {
      flex: 1;
      max-width: 300px;
    }

    .progress-text {
      display: block;
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 0.5rem;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background-color: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background-color: #3b82f6;
      transition: width 0.3s ease;
    }

    .setup-card, .current-reading-card, .photo-capture-card, 
    .results-card, .summary-card {
      margin-bottom: 1rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      margin-bottom: 0.5rem;
      color: #374151;
    }

    .form-control {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 1rem;
    }

    .form-control:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-help {
      font-size: 0.875rem;
      color: #6b7280;
      margin-top: 0.25rem;
    }

    .form-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }

    .reading-info {
      margin-bottom: 1rem;
    }

    .reading-info h3 {
      margin: 0 0 0.5rem 0;
      color: #1f2937;
    }

    .unit-info {
      display: flex;
      gap: 1rem;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .navigation-controls {
      display: flex;
      gap: 0.5rem;
    }

    .detection-result {
      margin-bottom: 1rem;
    }

    .detected-value {
      margin-bottom: 0.5rem;
    }

    .detected-value label {
      display: block;
      font-weight: 500;
      margin-bottom: 0.25rem;
      color: #374151;
    }

    .reading-input {
      width: 200px;
      padding: 0.5rem;
      border: 2px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 1.125rem;
      font-weight: 600;
      text-align: center;
    }

    .reading-input.confirmed {
      border-color: #10b981;
      background-color: #ecfdf5;
    }

    .confidence {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .result-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }

    .summary-stats {
      display: flex;
      gap: 2rem;
      margin: 1rem 0;
    }

    .stat {
      text-align: center;
    }

    .stat-value {
      display: block;
      font-size: 2rem;
      font-weight: 700;
      color: #3b82f6;
    }

    .stat-label {
      display: block;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .summary-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
    }

    .error-message {
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 0.375rem;
      padding: 1rem;
      margin: 1rem 0;
      text-align: center;
    }

    .error-message p {
      color: #dc2626;
      margin: 0 0 1rem 0;
    }

    @media (max-width: 768px) {
      .flash-reading-container {
        padding: 0.5rem;
      }
      
      .progress-header {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .progress-info {
        width: 100%;
        max-width: none;
      }
      
      .unit-info {
        flex-direction: column;
        gap: 0.25rem;
      }
      
      .form-actions, .result-actions, .summary-actions {
        flex-direction: column;
      }
      
      .summary-stats {
        flex-direction: column;
        gap: 1rem;
      }
    }
  `]
})
export class ReadingFlashFormComponent implements OnInit, OnDestroy {
  // Signals
  session = signal<FlashReadingSession | null>(null);
  condominiums = signal<Condominium[]>([]);
  measurementTypes = signal<MeasurementType[]>([]);
  isLoadingSetup = signal(false);
  error = signal<string | null>(null);
  
  // Form states
  setupForm: FormGroup;
  showResults = false;
  showFinalSummary = false;
  detectedValue = '';
  detectionConfidence: number | null = null;
  isValueConfirmed = false;
  isSaving = signal(false);
  
  // Current photo data
  currentPhotoData: PhotoCaptureEvent | null = null;
  
  // Cleanup
  private destroy$ = new Subject<void>();
  
  // Services
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private condominiumService = inject(CondominiumService);
  private unitService = inject(UnitService);
  private meterService = inject(MeterService);
  private measurementTypeService = inject(MeasurementTypeService);
  private readingService = inject(ReadingService);
  private detectionService = inject(DetectionService);
  private toastService = inject(ToastService);

  constructor() {
    this.setupForm = this.fb.group({
      condominiumId: ['', [Validators.required]],
      measurementTypeId: ['', [Validators.required]]
    });
    
    console.log('[FLASH-FORM] Formulário inicializado:', this.setupForm);
    console.log('[FLASH-FORM] Controles do formulário:', this.setupForm.controls);
  }

  ngOnInit(): void {
    console.log('[FLASH-FORM] Componente inicializado');
    console.log('[FLASH-FORM] CondominiumService:', this.condominiumService);
    
    // Monitorar mudanças no formulário
    this.setupForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        console.log('[FLASH-FORM] Valor do formulário mudou:', value);
        console.log('[FLASH-FORM] Formulário válido:', this.setupForm.valid);
      });
    
    this.loadCondominiums();
    this.loadMeasurementTypes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCondominiums(): void {
    console.log('[FLASH-FORM] Iniciando carregamento de condomínios...');
    this.isLoadingSetup.set(true);
    this.condominiumService.getCondominiums(0, 1000) // Carregar muitos condomínios para a seleção
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          console.log('[FLASH-FORM] Finalizando carregamento de condomínios');
          this.isLoadingSetup.set(false);
        })
      )
      .subscribe({
        next: (response) => {
          console.log('[FLASH-FORM] Condomínios carregados:', response);
          const condos = response.condominiums || [];
          console.log('[FLASH-FORM] Condomínios processados:', condos);
          this.condominiums.set(condos);
        },
        error: (error) => {
          console.error('[FLASH-FORM] Erro ao carregar condomínios:', error);
          this.error.set('Erro ao carregar condomínios');
        }
      });
  }

  private loadMeasurementTypes(): void {
    console.log('[FLASH-FORM] Iniciando carregamento de tipos de medição...');
    this.measurementTypeService.getMeasurementTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          console.log('[FLASH-FORM] Tipos de medição carregados:', types);
          this.measurementTypes.set(types);
        },
        error: (error) => {
          console.error('[FLASH-FORM] Erro ao carregar tipos de medição:', error);
          this.error.set('Erro ao carregar tipos de medição');
        }
      });
  }

  startFlashReading(): void {
    console.log('[FLASH-FORM] Iniciando leituras rápidas...');
    console.log('[FLASH-FORM] Form válido:', this.setupForm.valid);
    console.log('[FLASH-FORM] Form value:', this.setupForm.value);
    
    if (!this.setupForm.valid) {
      console.log('[FLASH-FORM] Formulário inválido, interrompendo');
      this.error.set('Por favor, selecione um condomínio e tipo de medidor');
      return;
    }
    
    const condominiumId = this.setupForm.value.condominiumId;
    const measurementTypeId = this.setupForm.value.measurementTypeId;
    console.log('[FLASH-FORM] ID do condomínio selecionado:', condominiumId);
    console.log('[FLASH-FORM] ID do tipo de medição selecionado:', measurementTypeId);
    
    const selectedCondominium = this.condominiums().find(c => c.id === Number(condominiumId));
    const selectedMeasurementType = this.measurementTypes().find(t => t.id === Number(measurementTypeId));
    console.log('[FLASH-FORM] Condomínio encontrado:', selectedCondominium);
    console.log('[FLASH-FORM] Tipo de medição encontrado:', selectedMeasurementType);
    
    if (!selectedCondominium || !selectedMeasurementType) {
      console.log('[FLASH-FORM] Condomínio ou tipo de medição não encontrado na lista');
      this.error.set('Condomínio ou tipo de medição não encontrado');
      return;
    }

    this.isLoadingSetup.set(true);
    console.log('[FLASH-FORM] Carregando unidades para condomínio:', condominiumId);
    
    // Carregar unidades do condomínio
    this.unitService.getUnitsByCondominiumId(condominiumId)
      .pipe(
        takeUntil(this.destroy$),
        switchMap((unitsResponse) => {
          if (!unitsResponse.units?.length) {
            throw new Error('Nenhuma unidade encontrada neste condomínio');
          }
          
          // Para simplicidade, vamos assumir que cada unidade tem pelo menos 1 medidor
          // Em produção, seria melhor carregar todos os medidores e filtrar os ativos
          return of(unitsResponse.units);
        }),
        finalize(() => this.isLoadingSetup.set(false))
      )
      .subscribe({
        next: (units) => {
          this.initializeSession(selectedCondominium, selectedMeasurementType, units);
        },
        error: (error) => {
          console.error('Erro ao carregar dados:', error);
          this.error.set('Erro ao carregar unidades ou medidores');
        }
      });
  }

  private initializeSession(condominium: Condominium, measurementType: MeasurementType, units: Unit[]): void {
    console.log('[FLASH-FORM] Inicializando sessão...');
    console.log('[FLASH-FORM] Condomínio:', condominium.name);
    console.log('[FLASH-FORM] Tipo de medição:', measurementType.name);
    console.log('[FLASH-FORM] Unidades:', units.length);
    
    // Para leituras rápidas, vamos assumir 1 medidor por unidade
    // Cada unidade = 1 leitura a ser feita
    const totalReadings = units.length;
    
    const newSession = {
      condominium,
      measurementType,
      units,
      currentUnitIndex: 0,
      currentMeterIndex: 0,
      totalReadings,
      completedReadings: 0
    };
    
    console.log('[FLASH-FORM] Nova sessão criada:', newSession);
    console.log('[FLASH-FORM] Total de leituras a fazer:', totalReadings);
    this.session.set(newSession);
    console.log('[FLASH-FORM] Sessão definida no signal');
  }

  getCurrentUnit(): Unit | null {
    const s = this.session();
    if (!s || s.currentUnitIndex >= s.units.length) {
      console.log('[FLASH-FORM] getCurrentUnit() - Índice fora do range ou sessão finalizada');
      return null;
    }
    const unit = s.units[s.currentUnitIndex];
    console.log('[FLASH-FORM] getCurrentUnit() - currentUnitIndex:', s.currentUnitIndex, 'unit:', unit);
    return unit;
  }

  getCurrentMeter(): Meter | null {
    const s = this.session();
    if (!s) return null;
    
    const currentUnit = this.getCurrentUnit();
    if (!currentUnit) return null;
    
    // Usar o tipo de medição selecionado na sessão
    return {
      id: currentUnit.id * 10 + s.currentMeterIndex + 1, // ID único baseado na unidade
      unit_id: currentUnit.id,
      measurement_type_id: s.measurementType.id,
      serial_number: `M${currentUnit.number}-${s.currentMeterIndex + 1}`,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      measurement_type: s.measurementType
    } as Meter;
  }

  onPhotoCaptured(photoEvent: PhotoCaptureEvent): void {
    this.currentPhotoData = photoEvent;
    this.detectReading(photoEvent.croppedImage);
  }

  private detectReading(imageBase64: string): void {
    // Converter base64 para File para o serviço de detecção
    const base64Data = imageBase64.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const file = new File([byteArray], 'reading.jpg', { type: 'image/jpeg' });
    
    this.detectionService.detectFromFile(file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: DetectionResponse) => {
          this.detectedValue = response.number_detected?.toString() || '';
          this.detectionConfidence = response.confidence || null;
          this.showResults = true;
        },
        error: (error: Error) => {
          console.error('Erro na detecção:', error);
          this.detectedValue = '';
          this.detectionConfidence = null;
          this.showResults = true;
          this.toastService.showError('Erro na detecção automática. Insira o valor manualmente.');
        }
      });
  }

  confirmReading(): void {
    console.log('[FLASH-FORM] Confirmando leitura...');
    console.log('[FLASH-FORM] detectedValue:', this.detectedValue);
    console.log('[FLASH-FORM] currentPhotoData:', this.currentPhotoData);
    
    // Validação mais flexível - permitir confirmação apenas com valor detectado
    if (!this.detectedValue) {
      console.log('[FLASH-FORM] Validação falhou - valor detectado ausente');
      return;
    }
    
    // Se não há foto, vamos simular dados de foto básicos
    if (!this.currentPhotoData) {
      console.log('[FLASH-FORM] AVISO: Sem dados de foto, criando dados mínimos...');
      this.currentPhotoData = {
        fullImage: '',
        croppedImage: '',
        croppedRegion: { x: 0, y: 0, width: 100, height: 100 }
      } as PhotoCaptureEvent;
    }
    
    const currentMeter = this.getCurrentMeter();
    console.log('[FLASH-FORM] currentMeter:', currentMeter);
    if (!currentMeter) {
      console.log('[FLASH-FORM] Medidor atual não encontrado');
      return;
    }
    
    console.log('[FLASH-FORM] Iniciando salvamento...');
    this.isSaving.set(true);
    
    const currentDate = new Date();
    const referenceMonth = currentDate.toISOString().slice(0, 7); // YYYY-MM
    
    const readingData: ReadingCreate = {
      meter_id: currentMeter.id,
      current_reading: this.detectedValue,
      reference_month: referenceMonth,
      status: ReadingStatus.COMPLETED,
      observations: 'Leitura rápida via foto'
    };
    
    console.log('[FLASH-FORM] Dados da leitura:', readingData);
    
    this.readingService.create(readingData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSaving.set(false))
      )
      .subscribe({
        next: (response) => {
          console.log('[FLASH-FORM] Leitura criada com sucesso:', response);
          
          // Extrair o reading da resposta da API
          const reading = response.data || response;
          
          // Agora salvar a foto se existir dados
          if (this.currentPhotoData && reading.id && (this.currentPhotoData.fullImage || this.currentPhotoData.croppedImage)) {
            console.log('[FLASH-FORM] Salvando foto para leitura ID:', reading.id);
            this.uploadPhotoForReading(reading.id);
          } else {
            console.log('[FLASH-FORM] Sem foto para salvar, movendo para próxima...');
            this.toastService.showSuccess('Leitura salva com sucesso!');
            this.moveToNextReading();
          }
        },
        error: (error) => {
          console.error('[FLASH-FORM] Erro ao salvar leitura:', error);
          this.toastService.showError('Erro ao salvar leitura');
        }
      });
  }

  private uploadPhotoForReading(readingId: number): void {
    if (!this.currentPhotoData) {
      console.log('[FLASH-FORM] Sem dados de foto para upload');
      this.toastService.showSuccess('Leitura salva com sucesso!');
      this.moveToNextReading();
      return;
    }

    console.log('[FLASH-FORM] Iniciando upload da foto para leitura:', readingId);

    const formData = new FormData();
    
    try {
      // Usar imagem completa se disponível
      if (this.currentPhotoData.fullImage) {
        const fullImageBlob = this.base64ToBlob(this.currentPhotoData.fullImage);
        console.log('[FLASH-FORM] Blob da imagem completa criado:', fullImageBlob.size, 'bytes');
        formData.append('file', fullImageBlob, `reading_${readingId}_full.jpg`);
      }
      
      // Usar imagem cropped se disponível
      if (this.currentPhotoData.croppedImage) {
        const croppedImageBlob = this.base64ToBlob(this.currentPhotoData.croppedImage);
        console.log('[FLASH-FORM] Blob da imagem cropped criado:', croppedImageBlob.size, 'bytes');
        formData.append('cropped_file', croppedImageBlob, `reading_${readingId}_cropped.jpg`);
      }
      
      console.log('[FLASH-FORM] FormData criado, enviando via ReadingService...');
      
      // Usar o mesmo método que o reading-form usa
      this.readingService.saveReadingPhoto(readingId, formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (photoResponse) => {
            console.log('[FLASH-FORM] Foto salva com sucesso:', photoResponse);
            
            // Se houve detecção automática na foto
            if (photoResponse.detection?.number_detected) {
              console.log('[FLASH-FORM] Detecção automática:', photoResponse.detection);
              const confidence = Math.round(photoResponse.detection.confidence * 100);
              this.toastService.showSuccess(
                `Leitura e foto salvas! Número detectado: ${photoResponse.detection.number_detected} (${confidence}%)`
              );
            } else {
              this.toastService.showSuccess('Leitura e foto salvas com sucesso!');
            }
            
            this.moveToNextReading();
          },
          error: (err) => {
            console.error('[FLASH-FORM] Erro ao salvar foto:', err);
            console.error('[FLASH-FORM] Detalhes do erro:', err.error);
            
            let errorMessage = 'Erro desconhecido ao salvar foto';
            if (err.error?.detail) {
              errorMessage = err.error.detail;
            } else if (err.error?.message) {
              errorMessage = err.error.message;
            } else if (err.message) {
              errorMessage = err.message;
            }
            
            // Mesmo com erro na foto, continuar pois a leitura já foi salva
            this.toastService.showSuccess(`Leitura salva! (Erro na foto: ${errorMessage})`);
            this.moveToNextReading();
          }
        });
        
    } catch (error) {
      console.error('[FLASH-FORM] Erro ao criar blobs das fotos:', error);
      this.toastService.showSuccess('Leitura salva! (Erro ao processar foto)');
      this.moveToNextReading();
    }
  }

  /**
   * Converte string base64 para Blob (mesmo método do reading-form)
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
      console.error('[FLASH-FORM] Erro ao converter base64 para Blob:', e);
      throw new Error('String base64 inválida para conversão de imagem.');
    }
  }

  private moveToNextReading(): void {
    console.log('[FLASH-FORM] Movendo para próxima leitura...');
    const s = this.session();
    if (!s) {
      console.log('[FLASH-FORM] Sessão não encontrada');
      return;
    }
    
    console.log('[FLASH-FORM] Sessão atual:', {
      currentUnitIndex: s.currentUnitIndex,
      totalUnits: s.units.length,
      completedReadings: s.completedReadings
    });
    
    // Incrementar readings completadas primeiro
    const updatedCompletedReadings = s.completedReadings + 1;
    
    // Verificar se ainda há unidades para processar
    if (s.currentUnitIndex < s.units.length - 1) {
      // Avançar para próxima unidade
      const updatedSession = {
        ...s,
        currentUnitIndex: s.currentUnitIndex + 1,
        completedReadings: updatedCompletedReadings
      };
      console.log('[FLASH-FORM] Avançando para unidade:', updatedSession.currentUnitIndex);
      console.log('[FLASH-FORM] Nova sessão:', updatedSession);
      this.session.set(updatedSession);
      
      // Forçar detecção de mudanças
      console.log('[FLASH-FORM] Forçando detecção de mudanças...');
      this.cdr.detectChanges();
      
      // Aguardar um tick antes de resetar
      setTimeout(() => {
        this.resetForNextReading();
        this.cdr.detectChanges();
      }, 10);
    } else {
      // Finalizar sessão - última unidade processada
      const updatedSession = {
        ...s,
        currentUnitIndex: s.units.length, // Marcar como "além do último índice"
        completedReadings: updatedCompletedReadings
      };
      console.log('[FLASH-FORM] Finalizando sessão - todas as unidades foram processadas');
      console.log('[FLASH-FORM] Sessão final:', updatedSession);
      this.session.set(updatedSession);
      this.showFinalSummary = true;
      this.cdr.detectChanges();
      
      // Resetar para limpar a interface
      setTimeout(() => {
        this.resetForNextReading();
        this.cdr.detectChanges();
      }, 10);
    }
  }

  private resetForNextReading(): void {
    console.log('[FLASH-FORM] Resetando para próxima leitura...');
    console.log('[FLASH-FORM] Estado antes do reset:', {
      showResults: this.showResults,
      detectedValue: this.detectedValue,
      currentPhotoData: !!this.currentPhotoData
    });
    
    this.showResults = false;
    this.detectedValue = '';
    this.detectionConfidence = null;
    this.isValueConfirmed = false;
    this.currentPhotoData = null;
    
    console.log('[FLASH-FORM] Estado após reset:', {
      showResults: this.showResults,
      detectedValue: this.detectedValue,
      currentPhotoData: !!this.currentPhotoData
    });
    console.log('[FLASH-FORM] Reset concluído - próxima unidade deve aparecer');
  }

  skipReading(): void {
    console.log('[FLASH-FORM] Pulando leitura...');
    const s = this.session();
    if (!s) return;
    
    console.log('[FLASH-FORM] Sessão antes de pular:', {
      currentUnitIndex: s.currentUnitIndex,
      totalUnits: s.units.length,
      completedReadings: s.completedReadings
    });
    
    // Avançar para próxima unidade sem incrementar completedReadings
    if (s.currentUnitIndex < s.units.length - 1) {
      const updatedSession = {
        ...s,
        currentUnitIndex: s.currentUnitIndex + 1
      };
      console.log('[FLASH-FORM] Pulando para unidade:', updatedSession.currentUnitIndex);
      this.session.set(updatedSession);
      this.cdr.detectChanges();
      
      setTimeout(() => {
        this.resetForNextReading();
        this.cdr.detectChanges();
      }, 10);
    } else {
      // Finalizar sessão após pular a última unidade
      const updatedSession = {
        ...s,
        currentUnitIndex: s.units.length // Marcar como "além do último índice"
      };
      console.log('[FLASH-FORM] Finalizando sessão após pular última unidade');
      this.session.set(updatedSession);
      this.showFinalSummary = true;
      this.cdr.detectChanges();
      
      setTimeout(() => {
        this.resetForNextReading();
        this.cdr.detectChanges();
      }, 10);
    }
  }

  previousReading(): void {
    console.log('[FLASH-FORM] Voltando para leitura anterior...');
    const s = this.session();
    if (!s || s.currentUnitIndex === 0) {
      console.log('[FLASH-FORM] Não pode voltar - já está na primeira unidade ou sessão não encontrada');
      return;
    }
    
    console.log('[FLASH-FORM] Sessão atual antes de voltar:', {
      currentUnitIndex: s.currentUnitIndex,
      completedReadings: s.completedReadings
    });
    
    const updatedSession = {
      ...s,
      currentUnitIndex: s.currentUnitIndex - 1,
      completedReadings: Math.max(0, s.completedReadings - 1)
    };
    
    console.log('[FLASH-FORM] Nova sessão (anterior):', updatedSession);
    this.session.set(updatedSession);
    
    // Forçar detecção de mudanças
    console.log('[FLASH-FORM] Forçando detecção de mudanças...');
    this.cdr.detectChanges();
    
    // Aguardar um tick antes de resetar
    setTimeout(() => {
      this.resetForNextReading();
      this.cdr.detectChanges();
      console.log('[FLASH-FORM] Voltou para unidade:', updatedSession.currentUnitIndex);
    }, 10);
  }

  retakePhoto(): void {
    this.resetForNextReading();
  }

  isFirstReading(): boolean {
    const s = this.session();
    const isFirst = !s || s.currentUnitIndex === 0;
    console.log('[FLASH-FORM] isFirstReading() - currentUnitIndex:', s?.currentUnitIndex, 'isFirst:', isFirst);
    return isFirst;
  }

  isSessionComplete(): boolean {
    const s = this.session();
    if (!s) return true;
    
    // Sessão está completa se:
    // 1. showFinalSummary está ativo, OU
    // 2. currentUnitIndex >= total de unidades (processou todas)
    const isComplete = this.showFinalSummary || s.currentUnitIndex >= s.units.length;
    console.log('[FLASH-FORM] isSessionComplete() - currentUnitIndex:', s.currentUnitIndex, 'totalUnits:', s.units.length, 'showFinalSummary:', this.showFinalSummary, 'isComplete:', isComplete);
    return isComplete;
  }

  getProgressPercentage(): number {
    const s = this.session();
    if (!s || s.totalReadings === 0) return 0;
    return Math.round((s.completedReadings / s.totalReadings) * 100);
  }

  getSkippedCount(): number {
    const s = this.session();
    if (!s) return 0;
    
    // Total de unidades processadas - leituras completadas = puladas
    const processedUnits = Math.min(s.currentUnitIndex + 1, s.units.length);
    return processedUnits - s.completedReadings;
  }

  startNewSession(): void {
    this.session.set(null);
    this.showFinalSummary = false;
    this.resetForNextReading();
    this.setupForm.reset();
  }

  clearError(): void {
    this.error.set(null);
  }

  close(): void {
    this.router.navigate(['/']);
  }

  trackByCondominiumId(index: number, condominium: Condominium): number {
    return condominium.id;
  }

  trackByMeasurementTypeId(index: number, measurementType: MeasurementType): number {
    return measurementType.id;
  }
}
