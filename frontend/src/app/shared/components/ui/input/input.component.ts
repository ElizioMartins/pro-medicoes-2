import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MaskDirective } from '@shared/directives/mask.directive';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaskDirective],
  template: `
    <div class="input-container">
      <label *ngIf="label" [for]="id" class="input-label">{{ label }}</label>
      <div class="input-wrapper">
        <input
          [type]="type"
          [id]="id"
          [value]="value"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [class.error]="error"
          [appMask]="mask || ''"
          (input)="onInput($event)"
          (blur)="onBlur()"
        />
      </div>
      <div *ngIf="error && errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
    </div>
  `,
  styles: [`
    .input-container {
      margin-bottom: 1rem;
    }
    
    .input-label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #374151;
    }
    
    .input-wrapper {
      position: relative;
    }
    
    input {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border-radius: 0.375rem;
      border: 1px solid #d1d5db;
      background-color: white;
      color: #1f2937;
      font-size: 1rem;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    
    input:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
    }
    
    input:disabled {
      background-color: #f3f4f6;
      cursor: not-allowed;
    }
    
    input.error {
      border-color: #dc2626;
    }
    
    input.error:focus {
      box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.2);
    }
    
    .error-message {
      margin-top: 0.25rem;
      color: #dc2626;
      font-size: 0.875rem;
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ]
})
export class InputComponent implements ControlValueAccessor {
  @Input() type = 'text';
  @Input() label = '';
  @Input() placeholder = '';
  @Input() id = `input-${Math.random().toString(36).substring(2, 9)}`;
  @Input() error = false;
  @Input() errorMessage = '';
  @Input() mask = '';
  
  value = '';
  disabled = false;
  touched = false;
  
  // Implementação do ControlValueAccessor
  onChange: any = () => {};
  onTouched: any = () => {};
  
  writeValue(value: any): void {
    this.value = value || '';
  }
  
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
  
  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.value = value;
    this.onChange(value);
  }
  
  onBlur(): void {
    if (!this.touched) {
      this.touched = true;
      this.onTouched();
    }
  }
}
