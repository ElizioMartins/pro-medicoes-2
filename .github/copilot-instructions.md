# Pro-Medições - AI Coding Agent Guide

## Project Overview
Sistema de gestão de leituras de medidores para condomínios com frontend Angular 18+ e backend FastAPI Python.

## Architecture Pattern
- **Frontend**: Angular standalone components, signals, dependency injection via `inject()`
- **Backend**: FastAPI with SQLAlchemy models in `dbmodels/` and routers in `routers/`
- **Data Flow**: Condominium → Units → Meters → Readings → Photos
- **Main Entities**: Condominium, Unit, Meter, MeasurementType, Reading, ReadingPhoto

## Component Structure
```
features/
├── auth/ - Authentication with guards
├── condominiums/ - Building management
├── units/ - Unit management per condominium
├── meters/ - Meter management per unit
├── readings/ - Reading capture and management
└── dashboard/ - Overview and statistics

shared/
├── components/ - Reusable UI components (card, button, input, meter-photo-capture)
├── models/ - TypeScript interfaces matching backend Pydantic models
└── validators/ - Custom form validators

core/
├── services/ - HTTP services extending BaseApiService
├── guards/ - Route protection
└── interceptors/ - HTTP request/response handling
```

## Key Patterns

### Services & Data Access
- All services extend `BaseApiService<T, TCreate, TUpdate>` for consistency
- Use `inject()` for dependency injection in standalone components
- Services follow naming: `EntityService` (e.g., `ReadingService`, `UnitService`)
- API calls use environment.apiUrl with `/api/` prefix

### Component Conventions
```typescript
// Standard component structure
@Component({
  selector: 'app-feature-name',
  standalone: true,
  imports: [CommonModule, ...],
  templateUrl: './component.html',
  styleUrls: ['./component.scss']
})
export class ComponentName implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private service = inject(ServiceName);
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### Form Handling
- Use reactive forms with FormBuilder
- Include conditional validators based on business logic
- Reading forms support both manual entry and photo capture
- Photo capture uses `MeterPhotoCaptureAngularComponent` with crop functionality

### Critical Business Logic
- **Hierarchy**: Condominium → Unit → Meter → Reading
- **Reading Flow**: Select condominium → Select unit → Choose meter → Capture photo → Process reading
- **Reading Status**: PENDING, COMPLETED, INACCESSIBLE, ERROR
- **Photo System**: Full image + cropped region for OCR processing
- **Reference Month**: Format YYYY-MM for billing periods

## Quick Development Commands
```bash
# Frontend development
cd frontend && npm start  # Runs on http://localhost:4200

# Backend development  
cd backend/server && python -m uvicorn main:app --reload  # Runs on http://localhost:8000

# Build production
cd frontend && npm run build
```

## API Integration Points
- **Readings API**: `/api/readings/meters/{meter_id}/readings` for meter-specific readings
- **Units API**: `/api/condominiums/{id}/units` for condominium units
- **Detection API**: `/api/detect` for OCR photo processing
- **File Upload**: FormData with 'file' field for photo uploads

## Component Communication
- Use `@Output()` EventEmitter for child-to-parent communication
- Services handle state management and API calls
- Route parameters pass context (condominium_id, unit_id, meter_id)
- Query parameters for filtering and pagination

## Testing & Debugging
- Use browser dev tools for Angular debugging
- FastAPI auto-generates docs at `/docs`
- Check network tab for API call debugging
- Component state visible through Angular DevTools

## Common Gotchas
- Always handle loading/error states in templates
- Use `takeUntil(this.destroy$)` for subscription cleanup
- Validate meter_id context before reading operations
- Handle photo capture fallbacks for device compatibility
- Reference month validation for billing accuracy