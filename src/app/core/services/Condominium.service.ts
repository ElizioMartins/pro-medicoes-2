import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Condominium } from '../models/Condominium';

@Injectable({
  providedIn: 'root'
})
export class CondominiumService {

  constructor() { }

  getCondominiums(): Observable<Condominium[]> {
    // Mock data for now, replace with actual API call
    const mockCondominiums: Condominium[] = [
      { id: '1', name: 'Residencial Parque das Flores', address: 'Rua das Palmeiras, 123' },
      { id: '2', name: 'Edifício Solar', address: 'Av. Principal, 456' },
      { id: '3', name: 'Condomínio Vista Mar', address: 'Travessa da Praia, 789' }
    ];
    return of(mockCondominiums);
  }
}
