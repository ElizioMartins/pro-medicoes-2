import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'; // For a back button

@Component({
  selector: 'app-reading-new',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <h1>Nova Leitura</h1>
      <p>Esta página está em desenvolvimento.</p>
      <a routerLink="/readings" class="back-link">Voltar para Leituras</a>
    </div>
  `,
  styles: [`
    .container {
      padding: 1.5rem;
      text-align: center;
    }
    .back-link {
      display: inline-block;
      margin-top: 1rem;
      padding: 0.5rem 1rem;
      border: 1px solid #ccc;
      border-radius: 0.375rem;
      text-decoration: none;
      color: #333;
    }
    .back-link:hover {
      background-color: #f0f0f0;
    }
  `]
})
export class ReadingNewComponent {}
