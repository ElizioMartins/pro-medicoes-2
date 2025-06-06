import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'; // Import RouterLink

@Component({
  selector: 'app-not-found', // Ensure selector is appropriate
  standalone: true,
  imports: [CommonModule, RouterLink], // Add RouterLink to imports
  template: `
    <div class="not-found-container text-center p-8 flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]"> {/* Adjust min-h as needed based on header/footer */}
      <h1 class="text-6xl font-bold text-blue-600 mb-4">404</h1>
      <h2 class="text-3xl font-semibold text-gray-800 mb-3">Página Não Encontrada</h2>
      <p class="text-lg text-gray-600 mb-8">
        Desculpe, a página que você está tentando acessar não foi encontrada ou não existe mais.
      </p>
      <a routerLink="/" 
         class="px-6 py-3 bg-blue-600 text-white rounded-md text-base font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-150">
        Voltar para a Página Inicial
      </a>
    </div>
  `,
  styles: [`
    .not-found-container {
      /* Basic styling, can be enhanced */
    }
  `]
})
export class NotFoundComponent {} // Ensure class name is NotFoundComponent
