import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor() { }

  getToken(): string | null {
    // Implementar lógica para obter o token (ex: de localStorage)
    return localStorage.getItem('access_token');
  }

  // Outros métodos de autenticação (login, logout, etc.) seriam implementados aqui
}


