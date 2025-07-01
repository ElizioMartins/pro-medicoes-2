import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { ErrorInterceptor } from './app/core/interceptors/error.interceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withInterceptors([
        { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true }
      ])
    ),
    provideAnimations()
  ]
}).catch(err => console.error(err));


