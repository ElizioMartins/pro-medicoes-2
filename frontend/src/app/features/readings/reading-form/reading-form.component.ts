import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpErrorResponse, HttpClientModule } from '@angular/common/http';
import { forkJoin, of, throwError, switchMap, Observable, Subject } from 'rxjs';
import { delay, tap, catchError, takeUntil } from 'rxjs/operators';
import { trigger, state, style, animate, transition } from '@angular/animations';

import { ReadingService } from "../../core/services/reading.service";
import { Reading } from "../../shared/models/reading.model";
import { ReadingPhoto } from "../../shared/models/reading.model";
import { MeterPhotoCaptureAngularComponent, PhotoCaptureEvent } from '@shared/components/meter-photo-capture/meter-photo-capture.component';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { InputComponent } from '@shared/components/ui/input/input.component';

@Component({
  selector: 'app-reading-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
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

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient,
    private route: ActivatedRoute,
    private readingService: ReadingService
  ) {
    this.readingForm = this.fb.group({
      currentReading: ['', [Validators.pattern('^[0-9]*[.]?[0-9]+$')]],
      inaccessible: [false],
      inaccessibleReason: [{ value: '', disabled: true }],
      notes: ['']
    });

    // Monitora mudanças no campo inaccessible
    this.readingForm.get('inaccessible')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(isInaccessible => {
        this.toggleInaccessibleFields(isInaccessible);
      });
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        switchMap(params => {
          const id = params.get('id');
          if (!id) {
            this.loadError = 'ID da leitura não fornecido';
            return of(undefined);
          }
          this.currentReadingIdFromRoute = parseInt(id);
          this.isLoading = true;
          return this.readingService.getReadingById(this.currentReadingIdFromRoute);
        })
      )
      .subscribe({
        next: reading => {
          if (reading) {
            this.currentReading = reading;
            this.readingForm.patchValue({
              currentReading: reading.currentReading || '',
              inaccessible: reading.status === 'INACCESSIBLE',
              inaccessibleReason: reading.inaccessibleReason || '',
              notes: reading.observations || ''
            });
            
            if (reading.status === 'INACCESSIBLE') {
              this.toggleInaccessibleFields(true);
            }
            
            if (reading.photos && reading.photos.length > 0) {
              // Carregaria a foto do servidor em produção
              this.capturedFullImage = reading.photos[0].filePath;
              this.capturedCroppedImage = reading.photos[0].croppedFilePath || null;
            }
            
            this.isLoading = false;
          } else {
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

  private base64ToBlob(base64: string, contentType: string = 'image/jpeg'): Blob {
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

  private detectReadingValue(base64Image: string): void {
    this.isDetecting = true;
    this.detectionError = null;
    try {
      const imageBlob = this.base64ToBlob(base64Image);
      const formData = new FormData();
      formData.append('file', imageBlob, 'cropped.jpg');

      const ocrApiUrl = 'http://localhost:8000/detect/';

      this.http.post<any>(ocrApiUrl, formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response && response.number_detected !== undefined && response.number_detected !== null) {
              this.readingForm.get('currentReading')?.setValue(response.number_detected);
              this.detectionError = null;
            } else {
              this.detectionError = 'Valor não detectado claramente. Insira manualmente.';
            }
            this.isDetecting = false;
          },
          error: (err: HttpErrorResponse) => {
            console.error('Erro na detecção OCR:', err);
            this.detectionError = `Erro na detecção OCR (${err.status}): ${err.message}. Tente novamente ou insira manualmente.`;
            this.isDetecting = false;
          }
        });
    } catch (error: any) {
      console.error('Erro ao preparar imagem para detecção:', error);
      this.detectionError = `Erro ao processar imagem: ${error.message}`;
      this.isDetecting = false;
    }
  }

  onSubmit(): void {
    if (this.readingForm.invalid || !this.currentReadingIdFromRoute) {
      this.readingForm.markAllAsTouched();
      console.error('Formulário inválido ou ID da Leitura faltando.');
      return;
    }

    this.isSaving = true;
    const formValue = this.readingForm.getRawValue();

    let status: Reading['status'];
    if (formValue.inaccessible) {
      status = 'INACCESSIBLE';
    } else if (formValue.currentReading && this.capturedCroppedImage) {
      status = 'COMPLETED';
    } else {
      status = 'PENDING';
    }

    const readingUpdatePayload: Partial<Reading> = {
      currentReading: formValue.inaccessible ? null : formValue.currentReading,
      observations: formValue.notes,
      status,
      inaccessibleReason: formValue.inaccessible ? formValue.inaccessibleReason : null,
      date: new Date()
    };

    const updateReading$ = this.readingService.updateReading(this.currentReadingIdFromRoute, readingUpdatePayload);

    let updatePhoto$: Observable<ReadingPhoto | null> = of(null);
    if (this.newPhotoTaken && this.capturedFullImage && this.capturedCroppedImage) {
      updatePhoto$ = this.readingService.saveReadingPhoto(
        this.currentReadingIdFromRoute,
        this.capturedFullImage,
        this.capturedCroppedImage
      );
    }

    forkJoin({ reading: updateReading$, photo: updatePhoto$ })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ reading, photo }) => {
          console.log('Leitura atualizada:', reading);
          if (photo) {
            console.log('Foto salva/atualizada:', photo);
          }
          this.isSaving = false;
          this.newPhotoTaken = false;
          this.router.navigate(['/readings']);
        },
        error: (err) => {
          console.error('Erro ao salvar leitura:', err);
          this.isSaving = false;
          // Mostrar mensagem de erro para o usuário
        }
      });
  }
}

