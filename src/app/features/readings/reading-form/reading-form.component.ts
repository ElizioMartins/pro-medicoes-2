import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute, ParamMap } from '@angular/router';
import { HttpClient, HttpErrorResponse, HttpClientModule } from '@angular/common/http';
import { forkJoin, of, throwError, switchMap, Observable, Subject, takeUntil } from 'rxjs';
import { delay, tap, catchError } from 'rxjs/operators';
import { trigger, state, style, animate, transition } from '@angular/animations'; // Import animations

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
  styleUrls: ['./reading-form.component.scss'], // Add SCSS file reference
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
  currentReadingIdFromRoute: string | null = null;
  currentReading: Reading | null = null;
  isSaving = false;
  isLoading = false;
  loadError: string | null = null;
  private newPhotoTaken = false;
  private destroy$ = new Subject<void>(); // For unsubscribing

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient,
    private route: ActivatedRoute,
    private readingService: ReadingService
  ) {
    this.readingForm = this.fb.group({
      currentReading: [{ value: '', disabled: false }, [Validators.pattern('^[0-9]*[.]?[0-9]+$')]], // Allow numbers and decimals
      inaccessible: [false],
      inaccessibleReason: [{ value: '', disabled: true }],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        switchMap((params: ParamMap) => {
          const id = params.get('id');
          if (id) {
            this.currentReadingIdFromRoute = id;
            return this.loadReadingData(id);
          } else {
            // Handle new reading creation
            return this.createNewReading();
          }
        })
      )
      .subscribe();

    // Handle inaccessible state changes
    this.readingForm.get('inaccessible')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(isInaccessible => {
        this.toggleInaccessibleFields(isInaccessible);
      });

    // Initial state check for inaccessible reason
    this.toggleInaccessibleFields(this.readingForm.get('inaccessible')?.value);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createNewReading(): Observable<void> {
    this.isLoading = true;
    this.loadError = null;
    return this.readingService.createReading({}).pipe(
      takeUntil(this.destroy$),
      tap(newReading => {
        this.currentReading = newReading;
        this.currentReadingIdFromRoute = newReading.id;
        this.readingForm.patchValue({
          notes: newReading.observations,
        });
        this.newPhotoTaken = false;
        this.capturedFullImage = null;
        this.capturedCroppedImage = null;
        this.isLoading = false;
        this.router.navigate(['/readings', newReading.id, 'form'], { replaceUrl: true });
      }),
      catchError(err => {
        console.error('Error creating new reading:', err);
        this.loadError = 'Erro ao criar uma nova leitura para registro.';
        this.isLoading = false;
        return of(undefined); // Return empty observable to complete the stream
      }),
      switchMap(() => of(undefined)) // Ensure the outer observable completes
    );
  }

  private loadReadingData(id: string): Observable<void> {
    this.isLoading = true;
    this.loadError = null;
    return this.readingService.getReadingById(id).pipe(
      takeUntil(this.destroy$),
      tap(readingData => {
        if (readingData) {
          this.currentReading = readingData;
          this.readingForm.patchValue({
            currentReading: readingData.currentReading,
            notes: readingData.observations,
            inaccessible: readingData.status === 'INACCESSIBLE',
            inaccessibleReason: readingData.inaccessibleReason
          });
          this.toggleInaccessibleFields(readingData.status === 'INACCESSIBLE');

          if (readingData.photos && readingData.photos.length > 0) {
            this.capturedFullImage = readingData.photos[0].filePath;
            this.capturedCroppedImage = readingData.photos[0].croppedFilePath || null;
          }
          this.isLoading = false;
        } else {
          this.loadError = `Leitura com ID ${id} não encontrada.`;
          this.isLoading = false;
        }
      }),
      catchError(err => {
        console.error('Error loading reading data:', err);
        this.loadError = 'Erro ao carregar dados da leitura.';
        this.isLoading = false;
        return of(undefined);
      }),
      switchMap(() => of(undefined))
    );
  }

  private toggleInaccessibleFields(isInaccessible: boolean): void {
    const currentReadingControl = this.readingForm.get('currentReading');
    const inaccessibleReasonControl = this.readingForm.get('inaccessibleReason');

    if (isInaccessible) {
      currentReadingControl?.setValue('');
      currentReadingControl?.disable();
      inaccessibleReasonControl?.enable();
      inaccessibleReasonControl?.setValidators(Validators.required);
      // Clear photo and detection state if unit becomes inaccessible
      this.detectionError = null;
      this.isDetecting = false;
      this.capturedFullImage = null;
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
      console.error('Error converting base64 to Blob:', e);
      throw new Error('Invalid base64 string for image conversion.');
    }
  }

  private detectReadingValue(base64Image: string): void {
    this.isDetecting = true;
    this.detectionError = null;
    try {
      const imageBlob = this.base64ToBlob(base64Image);
      const formData = new FormData();
      formData.append('file', imageBlob, 'cropped.jpg');

      // Replace with your actual OCR API endpoint
      const ocrApiUrl = 'http://localhost:8000/detect/'; // Example URL

      this.http.post<any>(ocrApiUrl, formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response && response.number_detected !== undefined && response.number_detected !== null) {
              this.readingForm.get('currentReading')?.setValue(response.number_detected);
              this.detectionError = null; // Clear previous errors if detection is successful
            } else {
              this.detectionError = 'Valor não detectado claramente. Insira manualmente.';
            }
            this.isDetecting = false;
          },
          error: (err: HttpErrorResponse) => {
            console.error('OCR Detection Error:', err);
            this.detectionError = `Erro na detecção OCR (${err.status}): ${err.message}. Tente novamente ou insira manualmente.`;
            this.isDetecting = false;
          }
        });
    } catch (error: any) {
      console.error('Error preparing image for detection:', error);
      this.detectionError = `Erro ao processar imagem: ${error.message}`;
      this.isDetecting = false;
    }
  }

  onSubmit(): void {
    if (this.readingForm.invalid || !this.currentReadingIdFromRoute) {
      this.readingForm.markAllAsTouched(); // Mark fields to show validation errors
      console.error('Form is invalid or Reading ID is missing.');
      return;
    }

    this.isSaving = true;
    const formValue = this.readingForm.getRawValue(); // Use getRawValue to include disabled fields like currentReading when inaccessible

    const readingUpdatePayload: Partial<Reading> = {
      id: this.currentReadingIdFromRoute,
      currentReading: formValue.inaccessible ? null : formValue.currentReading,
      observations: formValue.notes,
      status: formValue.inaccessible ? 'INACCESSIBLE' : 'PENDING', // Or determine based on logic
      inaccessibleReason: formValue.inaccessible ? formValue.inaccessibleReason : null,
      // We handle photos separately
    };

    const updateReading$ = this.readingService.updateReading(this.currentReadingIdFromRoute, readingUpdatePayload);

    let updatePhoto$: Observable<ReadingPhoto | null> = of(null); // Default to no photo update

    if (this.newPhotoTaken && this.capturedFullImage && this.capturedCroppedImage) {
      // If a new photo was taken, prepare the payload to update/create it
      const photoPayload: Partial<ReadingPhoto> = {
        readingId: this.currentReadingIdFromRoute,
        filePath: this.capturedFullImage, // Assuming base64 is stored directly for now
        croppedFilePath: this.capturedCroppedImage,
        timestamp: new Date()
      };
      // Decide whether to create a new photo or update an existing one
      // For simplicity, let's assume we always create/replace the first photo
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
          console.log('Reading updated:', reading);
          if (photo) {
            console.log('Photo saved/updated:', photo);
          }
          this.isSaving = false;
          this.newPhotoTaken = false; // Reset flag after successful save
          // Optionally show a success message (e.g., using a ToastService)
          this.router.navigate(['/readings']); // Navigate back to the list
        },
        error: (err) => {
          console.error('Error saving reading:', err);
          this.isSaving = false;
          // Optionally show an error message
        }
      });
  }
}

