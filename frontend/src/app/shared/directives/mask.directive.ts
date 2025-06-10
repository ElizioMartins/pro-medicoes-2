import { Directive, ElementRef, Input, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appMask]',
  standalone: true
})
export class MaskDirective {
  @Input('appMask') mask = '';
  
  constructor(
    private el: ElementRef,
    private control: NgControl
  ) {}

  @HostListener('input', ['$event'])
  onInput(event: InputEvent): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    let formattedValue = '';
    let maskIndex = 0;
    let valueIndex = 0;

    while (maskIndex < this.mask.length && valueIndex < value.length) {
      if (this.mask[maskIndex] === '0') {
        formattedValue += value[valueIndex];
        valueIndex++;
      } else {
        formattedValue += this.mask[maskIndex];
      }
      maskIndex++;
    }

    input.value = formattedValue;
    if (this.control?.control) {
      this.control.control.setValue(formattedValue, { emitEvent: false });
    }
  }

  @HostListener('blur', ['$event'])
  onBlur(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    if (input.value.length < this.mask.length) {
      if (this.control?.control) {
        this.control.control.setValue('', { emitEvent: false });
      }
    }
  }
}
