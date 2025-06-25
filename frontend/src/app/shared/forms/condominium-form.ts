import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Injectable } from '@angular/core';
import { CondominiumCreate, CondominiumUpdate } from '../models/condominium.model';
import { CustomValidators } from '../validators/custom-validators';

@Injectable({
  providedIn: 'root'
})
export class CondominiumFormService {
  constructor(private fb: FormBuilder) {}

  createForm(initialData?: Partial<CondominiumCreate>): FormGroup {
    return this.fb.group({
      name: [initialData?.name || '', [Validators.required, Validators.minLength(3)]],
      address: [initialData?.address || '', [Validators.required]],
      cnpj: [initialData?.cnpj || '', [Validators.required, CustomValidators.cnpj()]],
      manager: [initialData?.manager || '', [Validators.required]],
      phone: [initialData?.phone || '', [Validators.required]],
      email: [initialData?.email || '', [Validators.required, Validators.email]]
    });
  }

  getFormData(form: FormGroup): CondominiumCreate {
    return {
      name: form.get('name')?.value,
      address: form.get('address')?.value,
      cnpj: form.get('cnpj')?.value,
      manager: form.get('manager')?.value,
      phone: form.get('phone')?.value,
      email: form.get('email')?.value
    };
  }
}


