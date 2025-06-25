import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Função auxiliar para validação de CNPJ (simplificada para o exemplo)
function isValidCNPJ(cnpj: string): boolean {
  // Implementação real da validação de CNPJ seria mais complexa
  // Aqui, apenas um placeholder para demonstrar a estrutura
  return cnpj.length === 14; // Apenas verifica o tamanho por enquanto
}

export class CustomValidators {
  static cnpj(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const cnpj = control.value.replace(/[^\d]/g, '');
      if (cnpj.length !== 14) {
        return { cnpj: { message: 'CNPJ deve ter 14 dígitos' } };
      }
      
      // Implementar validação de CNPJ
      if (!isValidCNPJ(cnpj)) {
        return { cnpj: { message: 'CNPJ inválido' } };
      }
      
      return null;
    };
  }

  static meterReading(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const reading = control.value.toString();
      if (!/^\d+(\.\d{1,3})?$/.test(reading)) {
        return { meterReading: { message: 'Formato de leitura inválido' } };
      }
      
      return null;
    };
  }
}


