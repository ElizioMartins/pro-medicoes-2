import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { HeaderComponent } from './components/layout/header/header.component';
import { FooterComponent } from './components/layout/footer/footer.component';
import { ButtonComponent } from './components/ui/button/button.component';
import { CardComponent } from './components/ui/card/card.component';
import { InputComponent } from './components/ui/input/input.component';
import { ToastComponent } from './components/ui/toast/toast.component';

@NgModule({
  declarations: [
    NotFoundComponent,
    HeaderComponent,
    FooterComponent,
    ButtonComponent,
    CardComponent,
    InputComponent,
    ToastComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],
  exports: [
    NotFoundComponent,
    HeaderComponent,
    FooterComponent,
    ButtonComponent,
    CardComponent,
    InputComponent,
    ToastComponent
  ]
})
export class SharedModule { }
