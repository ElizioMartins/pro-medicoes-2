import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute, ParamMap } from '@angular/router'; // Import ActivatedRoute, ParamMap
import { HttpClient, HttpErrorResponse, HttpClientModule } from '@angular/common/http';
import { forkJoin, of, throwError, switchMap, Observable } from 'rxjs'; // Import RxJS operators

// Import Services and Models
import { ReadingService } from '@core/services/Reading.service';
import { Reading } from '@core/models/Reading';
import { ReadingPhoto } from '@core/models/ReadingPhoto';

// Import the photo capture component and its event interface
import { MeterPhotoCaptureAngularComponent, PhotoCaptureEvent } from '@shared/components/meter-photo-capture/meter-photo-capture.component';

// Import shared UI components
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { InputComponent } from '@shared/components/ui/input/input.component';
// LabelComponent, TextareaComponent, CheckboxComponent removed

@Component({
  selector: 'app-reading-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    HttpClientModule, // Keep if previously added
    MeterPhotoCaptureAngularComponent,
    CardComponent,
    ButtonComponent,
    InputComponent
    // LabelComponent, TextareaComponent, CheckboxComponent removed
  ],
  template: `
    <div class="container mx-auto p-4">
      <app-card>
        <div class="p-6">
          <h1 class="text-2xl font-bold mb-6">{{ currentReadingId ? 'Editar Leitura' : 'Registrar Nova Leitura' }}</h1>
          
          <div *ngIf="isLoading" class="text-center p-4">
            <p>Carregando dados da leitura...</p>
            <!-- Add spinner here -->
          </div>

          <div *ngIf="loadError" class="my-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <strong>Erro:</strong> {{ loadError }}
            <div *ngIf="!currentReadingIdFromRoute" class="mt-2">
                Este formulário requer um ID de leitura na rota para carregar os dados.
            </div>
          </div>

          <form [formGroup]="readingForm" (ngSubmit)="onSubmit()" *ngIf="!isLoading && currentReadingIdFromRoute">
            <div class="space-y-6"> {/* Main vertical spacing for form sections */}
              
              <!-- Section: Inaccessible Checkbox -->
              <div class="flex items-center space-x-2">
                <input type="checkbox" id="inaccessible" formControlName="inaccessible" class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"> {/* Removed align-middle mr-2 */}
                <label for="inaccessible" class="text-sm font-medium text-gray-700">Unidade Inacessível</label>
              </div>

              <!-- Section: Inaccessible Reason -->
              <div *ngIf="readingForm.get('inaccessible')?.value"> {/* Removed pl-2 */}
                <label for="inaccessibleReason" class="block text-sm font-medium text-gray-700 mb-1">Motivo da Inacessibilidade</label>
                <select formControlName="inaccessibleReason" id="inaccessibleReason" 
                        class="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"> {/* Removed mt-1 */}
                  <option value="" disabled>Selecione um motivo</option>
                  <option value="Unidade fechada">Unidade fechada</option>
                  <option value="Morador negou acesso">Morador negou acesso</option>
                  <option value="Medidor inacessível/danificado">Medidor inacessível/danificado</option>
                  <option value="outro">Outro (especifique nas observações)</option>
                </select>
                <div *ngIf="readingForm.get('inaccessibleReason')?.touched && readingForm.get('inaccessibleReason')?.errors?.['required']" 
                     class="text-xs text-red-600 mt-1">Motivo é obrigatório.</div>
              </div>

              <!-- Section: Current Reading -->
              <div *ngIf="!readingForm.get('inaccessible')?.value">
                <label for="currentReading" class="block text-sm font-medium text-gray-700 mb-1">Leitura Atual</label>
                <app-input type="number" formControlName="currentReading" id="currentReading" class="w-full"></app-input> {/* Added w-full */}
                <div *ngIf="isDetecting" class="text-sm text-blue-600 mt-1"> {/* Added mt-1 for spacing */}
                  Detectando valor da leitura na imagem... (aguarde)
                </div>
                <div *ngIf="detectionError" class="text-sm text-red-600 mt-1 p-2 border border-red-200 bg-red-50 rounded"> {/* Added mt-1 */}
                  <strong>Erro na Detecção:</strong> {{ detectionError }} <br>
                  Por favor, insira o valor manualmente ou tente capturar outra foto.
                </div>
              </div>

              <!-- Section: Meter Photo -->
              <div> {/* Wrapped in a div for consistent spacing from space-y-6 */}
                <label class="block text-sm font-medium text-gray-700 mb-1">Foto do Medidor</label>
                <app-button type="button" variant="outline" (click)="triggerPhotoCaptureModal()" [disabled]="readingForm.get('inaccessible')?.value"
                            class="w-full sm:w-auto"> {/* Added width classes */}
                  {{ (capturedFullImage || (currentReading && currentReading.photos && currentReading.photos.length > 0)) ? 'Ver/Alterar Foto' : 'Capturar Foto' }}
                </app-button>

                <div *ngIf="capturedFullImage || (currentReading && currentReading.photos && currentReading.photos.length > 0)" class="mt-2 p-2 border rounded-md">
                  <p class="text-sm font-medium text-gray-600 mb-1">Prévia:</p>
                  <div class="flex space-x-2">
                    <img [src]="capturedFullImage || currentReading?.photos?.[0]?.filePath" alt="Foto completa" class="w-1/2 max-h-40 object-contain border rounded">
                    <img *ngIf="capturedCroppedImage || currentReading?.photos?.[0]?.croppedFilePath" [src]="capturedCroppedImage || currentReading?.photos?.[0]?.croppedFilePath" alt="Foto recortada" class="w-1/2 max-h-40 object-contain border rounded bg-gray-100">
                  </div>
                </div>
              </div>

              <!-- Section: Notes -->
              <div>
                <label for="notes" class="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea formControlName="notes" id="notes" rows="3" class="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></textarea> {/* Removed mt-1 */}
              </div>

              <!-- Section: Action Buttons (already seems good) -->
              <div class="flex justify-end space-x-3 pt-4">
                <app-button type="button" variant="outline" routerLink="/readings" [disabled]="isSaving">Cancelar</app-button>
                <app-button type="submit" [disabled]="readingForm.invalid || isDetecting || isSaving || !currentReadingIdFromRoute">
                  <span *ngIf="isSaving" class="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" role="status" aria-hidden="true"></span>
                  {{ isSaving ? 'Salvando...' : 'Salvar Leitura' }}
                </app-button>
              </div>
            </div>
          </form>
        </div>
      </app-card>

      <div *ngIf="showPhotoCaptureModal" 
           class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white p-0 rounded-lg shadow-xl max-w-lg w-full">
          <app-meter-photo-capture 
            (photoCaptured)="onPhotoSuccessfullyCaptured($event)"
            (closeCapture)="onClosePhotoCaptureModal()">
          </app-meter-photo-capture>
        </div>
      </div>
    </div>
  `
})
export class ReadingFormComponent implements OnInit {
  readingForm: FormGroup;
  showPhotoCaptureModal = false;
  capturedFullImage: string | null = null; // For new/updated full photo (base64)
  capturedCroppedImage: string | null = null; // For new/updated cropped photo (base64)
  
  isDetecting = false;
  detectionError: string | null = null;

  currentReadingIdFromRoute: string | null = null; // Renamed for clarity
  currentReading: Reading | null = null; // Stores loaded reading
  isSaving = false;
  isLoading = false; // For loading initial reading data
  loadError: string | null = null;

  private newPhotoTaken = false; // Flag to indicate if a new photo was captured in this session

  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private http: HttpClient,
    private route: ActivatedRoute, // Inject ActivatedRoute
    private readingService: ReadingService // Inject ReadingService
  ) {
    this.readingForm = this.fb.group({
      currentReading: [{ value: '', disabled: false }],
      inaccessible: [false],
      inaccessibleReason: [{ value: '', disabled: true }],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params: ParamMap) => {
      const id = params.get('id');
      if (id) {
        this.currentReadingIdFromRoute = id;
        this.loadReadingData(id);
      } else {
        // Navigating from /readings/new, create a draft reading
        this.isLoading = true;
        this.loadError = null;
        this.readingService.createReading({}).subscribe({ // Pass any default data if needed
          next: (newReading) => {
            this.currentReading = newReading;
            this.currentReadingIdFromRoute = newReading.id;
            // Patch form with any relevant values from the new draft reading
            // (most will be default/empty, but status and ID are important)
            this.readingForm.patchValue({
                notes: newReading.observations, // If any default observations
                // other fields like currentReading, inaccessible, inaccessibleReason should be empty/default
            }); 
            this.newPhotoTaken = false; // No photo taken yet for a new reading
            this.capturedFullImage = null;
            this.capturedCroppedImage = null;
            this.isLoading = false;
            // Update URL without navigation trigger, to reflect the new ID
            this.router.navigate(['/readings', newReading.id, 'form'], { replaceUrl: true });
          },
          error: (err) => {
            console.error('Error creating new reading:', err);
            this.loadError = 'Erro ao criar uma nova leitura para registro.';
            this.isLoading = false;
          }
        });
      }
    });

    this.readingForm.get('inaccessible')?.valueChanges.subscribe(isInaccessible => {
      const currentReadingControl = this.readingForm.get('currentReading');
      const inaccessibleReasonControl = this.readingForm.get('inaccessibleReason');

      if (isInaccessible) {
        currentReadingControl?.setValue('');
        currentReadingControl?.disable();
        inaccessibleReasonControl?.enable();
        inaccessibleReasonControl?.setValidators(Validators.required);
        this.detectionError = null; 
        this.isDetecting = false; 
        this.capturedFullImage = null; // Clear photo if unit becomes inaccessible
        this.capturedCroppedImage = null;
        this.newPhotoTaken = false;
      } else {
        currentReadingControl?.enable();
        inaccessibleReasonControl?.setValue('');
        inaccessibleReasonControl?.disable();
        inaccessibleReasonControl?.clearValidators();
      }
      currentReadingControl?.updateValueAndValidity();
      inaccessibleReasonControl?.updateValueAndValidity();
    });

    if (!this.readingForm.get('inaccessible')?.value) {
        this.readingForm.get('inaccessibleReason')?.disable();
    } else {
        this.readingForm.get('inaccessibleReason')?.enable();
        this.readingForm.get('inaccessibleReason')?.setValidators(Validators.required);
    }
  }

  loadReadingData(id: string): void {
    this.isLoading = true;
    this.loadError = null;
    this.readingService.getReadingById(id).subscribe({
      next: (readingData) => {
        if (readingData) {
          this.currentReading = readingData;
          this.readingForm.patchValue({
            currentReading: readingData.currentReading,
            notes: readingData.observations,
            inaccessible: readingData.status === 'INACCESSIBLE',
            inaccessibleReason: readingData.inaccessibleReason
          });

          // If inaccessible, ensure form state is correct
          if (readingData.status === 'INACCESSIBLE') {
             this.readingForm.get('inaccessibleReason')?.enable();
             this.readingForm.get('currentReading')?.disable();
          }


          if (readingData.photos && readingData.photos.length > 0) {
            // For simplicity, using the first photo's base64 directly if stored,
            // or assuming filePaths are direct base64 strings in mock.
            // In a real app, filePaths would be URLs, and you'd fetch them or display via <img> src.
            this.capturedFullImage = readingData.photos[0].filePath; 
            this.capturedCroppedImage = readingData.photos[0].croppedFilePath || null;
          }
          this.isLoading = false;
        } else {
          this.loadError = `Leitura com ID ${id} não encontrada.`;
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Error loading reading data:', err);
        this.loadError = 'Erro ao carregar dados da leitura. Verifique o console para mais detalhes.';
        this.isLoading = false;
      }
    });
  }

  triggerPhotoCaptureModal(): void {
    this.showPhotoCaptureModal = true;
  }

  onPhotoSuccessfullyCaptured(event: PhotoCaptureEvent): void {
    this.capturedFullImage = event.fullImage;
    this.capturedCroppedImage = event.croppedImage;
    this.newPhotoTaken = true; // Mark that a new photo has been taken
    this.showPhotoCaptureModal = false;
    this.detectionError = null; 

    if (this.capturedCroppedImage && !this.readingForm.get('inaccessible')?.value) {
      this.detectReadingValue(this.capturedCroppedImage);
    }
  }
  
  private base64ToBlob(base64: string, contentType: string = 'image/jpeg'): Blob {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
  }

  private detectReadingValue(base64Image: string): void {
    this.isDetecting = true;
    this.detectionError = null;
    
    // Convert base64 to Blob for multipart/form-data
    const imageBlob = this.base64ToBlob(base64Image);
    const formData = new FormData();
    formData.append('file', imageBlob, 'cropped.jpg');

    this.http.post<any>('http://localhost:8000/detect/', formData).subscribe({
      next: (response) => {
        if (response && response.number_detected !== undefined && response.number_detected !== null) {
          this.readingForm.get('currentReading')?.setValue(response.number_detected);
        } else {
          this.detectionError = 'Valor não detectado de forma clara. Insira manualmente.';
        }
        this.isDetecting = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error detecting reading value:', err);
        if (err.status === 0 || err.status === -1) {
             this.detectionError = 'Erro de rede/CORS ao conectar ao serviço OCR.';
        } else if (err.error && err.error.detail) {
             this.detectionError = `Detecção falhou: ${err.error.detail}`;
        } else {
             this.detectionError = 'Erro na detecção do valor.';
        }
        this.isDetecting = false;
      }
    });
  }
  
  onClosePhotoCaptureModal(): void {
    this.showPhotoCaptureModal = false;
  }

  onSubmit(): void {
    if (this.readingForm.invalid) {
      this.readingForm.markAllAsTouched();
      this.loadError = "Formulário inválido. Verifique os campos.";
      return;
    }
    if (!this.currentReadingIdFromRoute) {
      this.loadError = "ID da Leitura não encontrado. Não é possível salvar.";
      console.error('currentReadingId is null. Cannot save.');
      return;
    }

    this.isSaving = true;
    this.detectionError = null;
    this.loadError = null;

    let savePhotoObs: Observable<ReadingPhoto | null> = of(null);

    if (this.newPhotoTaken && this.capturedFullImage && this.capturedCroppedImage) {
      // In a real app, Blobs would be sent. ReadingService mock handles base64.
      savePhotoObs = this.readingService.saveReadingPhoto(
        this.currentReadingIdFromRoute, 
        this.capturedFullImage, 
        this.capturedCroppedImage
      );
    }

    savePhotoObs.pipe(
      switchMap((savedPhoto: ReadingPhoto | null) => {
        const formValues = this.readingForm.getRawValue();
        // Corrected Logic to be applied:
        const newStatus = formValues.inaccessible ? 'INACCESSIBLE' : 'COMPLETED';

        const readingDataToUpdate: Partial<Reading> = {
          currentReading: newStatus === 'INACCESSIBLE' ? '' : formValues.currentReading,
          observations: formValues.notes,
          inaccessibleReason: formValues.inaccessible ? formValues.inaccessibleReason : undefined,
          status: newStatus,
          // Preserve existing registeredBy and date unless explicitly changed below
          registeredBy: this.currentReading?.registeredBy,
          date: this.currentReading?.date
        };

        // If the original status of the reading was 'PENDING' and the new status is a final one
        if (this.currentReading && this.currentReading.status === 'PENDING' && (newStatus === 'COMPLETED' || newStatus === 'INACCESSIBLE')) {
            readingDataToUpdate.registeredBy = 'Operador App (Angular)'; // Example: Set the user who completed it
            readingDataToUpdate.date = new Date(); // Set the date of completion/finalization
        }
        // End of Corrected Logic

        // photos handling (conceptual, if ReadingService needs it explicitly)
        // if (savedPhoto) {
        //   readingDataToUpdate.photos = [savedPhoto]; // Or logic to append/replace
        // } else if (this.currentReading?.photos) {
        //   readingDataToUpdate.photos = this.currentReading.photos;
        // }


        return this.readingService.updateReading(this.currentReadingIdFromRoute!, readingDataToUpdate);
      })
    ).subscribe({
      next: (updatedReading) => {
        this.isSaving = false;
        this.newPhotoTaken = false; // Reset flag
        console.log('Leitura salva com sucesso:', updatedReading);
        // TODO: Add success toast/message
        this.router.navigate(['/readings']);
      },
      error: (err) => {
        this.isSaving = false;
        // Ensure err.message or a default is used
        const message = err instanceof HttpErrorResponse ? err.message : (err.message || 'Erro desconhecido');
        this.loadError = 'Erro ao salvar a leitura: ' + message;
        console.error('Error saving reading:', err);
      }
    });
  }
}
