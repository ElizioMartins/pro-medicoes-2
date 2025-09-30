import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MonthlyConsumptionReport {
  period: string;
  condominium: {
    id: string;
    name: string;
  };
  units: {
    id: string;
    number: string;
    resident: string;
    currentReading: number;
    previousReading: number;
    consumption: number;
    cost: number;
  }[];
  summary: {
    totalConsumption: number;
    totalCost: number;
    averageConsumption: number;
    unitsCount: number;
  };
}

export interface ReadingData {
  id: number;
  meter_id: number;
  current_reading: string;
  reference_month: string;
  date: string;
  meter: {
    id: number;
    serial_number: string;
    unit: {
      id: number;
      number: string;
      condominium: {
        id: number;
        name: string;
      };
    };
    measurement_type: {
      id: number;
      name: string;
      unit: string;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api`;

  /**
   * Busca todas as leituras de um condomínio em um período específico
   */
  getReadingsByCondominiumAndPeriod(
    condominiumId: number, 
    referenceMonth: string
  ): Observable<ReadingData[]> {
    const params = {
      condominium_id: condominiumId.toString(),
      reference_month: referenceMonth,
      limit: '1000' // Busca todas as leituras
    };

    return this.http.get<ReadingData[]>(`${this.apiUrl}/readings/`, { params });
  }

  /**
   * Gera relatório de consumo mensal baseado nas leituras reais
   */
  generateMonthlyConsumptionReport(
    condominiumId: number, 
    referenceMonth: string
  ): Observable<MonthlyConsumptionReport> {
    return this.getReadingsByCondominiumAndPeriod(condominiumId, referenceMonth).pipe(
      map(readings => this.processReadingsToReport(readings, referenceMonth))
    );
  }

  /**
   * Processa as leituras brutas em um relatório estruturado
   */
  private processReadingsToReport(
    readings: ReadingData[], 
    referenceMonth: string
  ): MonthlyConsumptionReport {
    if (!readings || readings.length === 0) {
      throw new Error('Nenhuma leitura encontrada para o período selecionado');
    }

    // Agrupa leituras por unidade
    const unitMap = new Map<number, ReadingData[]>();
    readings.forEach(reading => {
      const unitId = reading.meter.unit.id;
      if (!unitMap.has(unitId)) {
        unitMap.set(unitId, []);
      }
      unitMap.get(unitId)!.push(reading);
    });

    // Converte o período para formato legível
    const [year, month] = referenceMonth.split('-');
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const formattedPeriod = `${monthNames[parseInt(month) - 1]} de ${year}`;

    // Pega informações do condomínio da primeira leitura
    const firstReading = readings[0];
    const condominium = {
      id: firstReading.meter.unit.condominium.id.toString(),
      name: firstReading.meter.unit.condominium.name
    };

    // Processa cada unidade
    const units = Array.from(unitMap.entries()).map(([unitId, unitReadings]) => {
      const latestReading = this.getLatestReading(unitReadings);
      const previousReading = this.getPreviousReading(unitReadings, referenceMonth);
      
      const currentValue = this.parseReadingValue(latestReading.current_reading);
      const previousValue = previousReading ? this.parseReadingValue(previousReading.current_reading) : currentValue;
      const consumption = Math.max(0, currentValue - previousValue);
      const cost = consumption * 3.5; // R$ 3,50 por m³ (pode ser configurável)

      return {
        id: unitId.toString(),
        number: latestReading.meter.unit.number,
        resident: this.getResidentName(latestReading.meter.unit.number), // Mock por enquanto
        currentReading: currentValue,
        previousReading: previousValue,
        consumption,
        cost: parseFloat(cost.toFixed(2)) // Arredonda para 2 casas decimais
      };
    });

    // Calcula o resumo
    const totalConsumption = parseFloat(units.reduce((sum, unit) => sum + unit.consumption, 0).toFixed(2));
    const totalCost = parseFloat(units.reduce((sum, unit) => sum + unit.cost, 0).toFixed(2));
    const averageConsumption = parseFloat((totalConsumption / units.length || 0).toFixed(2));

    return {
      period: formattedPeriod,
      condominium,
      units: units.sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true })),
      summary: {
        totalConsumption,
        totalCost,
        averageConsumption,
        unitsCount: units.length
      }
    };
  }

  /**
   * Converte o valor de leitura para número, tratando possíveis formatos
   */
  private parseReadingValue(readingValue: string): number {
    // Remove caracteres não numéricos exceto ponto e vírgula
    const cleanValue = readingValue.replace(/[^\d.,]/g, '');
    // Substitui vírgula por ponto para conversão
    const normalizedValue = cleanValue.replace(',', '.');
    const parsed = parseFloat(normalizedValue);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Obtém a leitura mais recente de uma unidade
   */
  private getLatestReading(readings: ReadingData[]): ReadingData {
    return readings.reduce((latest, current) => {
      const latestDate = new Date(latest.date);
      const currentDate = new Date(current.date);
      return currentDate > latestDate ? current : latest;
    });
  }

  /**
   * Obtém a leitura do mês anterior (se existir)
   */
  private getPreviousReading(readings: ReadingData[], currentMonth: string): ReadingData | null {
    const [year, month] = currentMonth.split('-').map(Number);
    const previousMonth = month === 1 ? 12 : month - 1;
    const previousYear = month === 1 ? year - 1 : year;
    const previousMonthStr = `${previousYear}-${previousMonth.toString().padStart(2, '0')}`;

    const previousReadings = readings.filter(r => r.reference_month === previousMonthStr);
    return previousReadings.length > 0 ? this.getLatestReading(previousReadings) : null;
  }

  /**
   * Mock para nome do morador - em produção viria do banco de dados
   */
  private getResidentName(unitNumber: string): string {
    const mockResidents: Record<string, string> = {
      '101': 'João Silva',
      '102': 'Maria Santos',
      '103': 'Pedro Costa',
      '201': 'Ana Oliveira',
      '202': 'Carlos Lima',
      '203': 'Lucia Ferreira',
      '301': 'Ricardo Alves',
      '302': 'Sandra Moura'
    };

    return mockResidents[unitNumber] || `Morador da ${unitNumber}`;
  }
}