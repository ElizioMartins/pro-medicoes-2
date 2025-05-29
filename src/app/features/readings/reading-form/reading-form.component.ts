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
  templateUrl: './reading-form.component.html',
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
