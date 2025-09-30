import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Reading } from '../../shared/models/reading.model';
import { Condominium } from '../../shared/models/condominium.model';
import { Unit } from '../../shared/models/unit.model';
import { User } from '../../shared/models/user.model';
import { MeasurementType } from '../../shared/models/measurement-type.model';

export interface DashboardStats {
  condominiumsCount: number;
  unitsCount: number;
  readingsCount: number;
  usersCount: number;
  metersCount: number;
}

export interface RecentReading {
  id: number;
  unit: string;
  type: string;
  value: string;
  date: Date;
  condominium: string;
  status: string;
}

export interface MonthlyReadingsStats {
  month: string;
  count: number;
  percentage: number;
}

export interface ReadingsByType {
  type: string;
  count: number;
  percentage: number;
}

export interface DashboardAlerts {
  overdueReadings: number;
  inaccessibleMeters: number;
  lowBatteryMeters: number;
  anomalousReadings: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentReadings: RecentReading[];
  monthlyStats: MonthlyReadingsStats[];
  readingsByType: ReadingsByType[];
  completionRate: number;
  averageReadingValue: number;
  alerts: DashboardAlerts;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly apiUrl = `${environment.apiUrl}/api`;
  private readonly http = inject(HttpClient);

  getDashboardStats(): Observable<DashboardStats> {
    // Usar endpoints existentes com paginação que retornam o total
    const condominiums$ = this.http.get<{ condominiums: Condominium[], total: number }>(`${this.apiUrl}/condominiums?limit=1`).pipe(
      map(data => ({ total: data.total })),
      catchError(() => of({ total: 0 }))
    );
    
    const units$ = this.http.get<{ units: Unit[], total: number }>(`${this.apiUrl}/units?limit=1`).pipe(
      map(data => ({ total: data.total })),
      catchError(() => of({ total: 0 }))
    );
    
    // Readings endpoint retorna apenas lista, então vamos buscar um número limitado e calcular
    const readings$ = this.http.get<Reading[]>(`${this.apiUrl}/readings?limit=1000`).pipe(
      map(data => ({ total: data.length })),
      catchError(() => of({ total: 0 }))
    );
    
    const users$ = this.http.get<{ users: User[], total: number }>(`${this.apiUrl}/users?page=1&pageSize=1`).pipe(
      map(data => ({ total: data.total })),
      catchError(() => of({ total: 0 }))
    );
    
    // Meters endpoint retorna apenas lista, então vamos buscar um número limitado e calcular
    const meters$ = this.http.get<{ id: number }[]>(`${this.apiUrl}/meters?limit=1000`).pipe(
      map(data => ({ total: data.length })),
      catchError(() => of({ total: 0 }))
    );

    return forkJoin({
      condominiums: condominiums$,
      units: units$,
      readings: readings$,
      users: users$,
      meters: meters$
    }).pipe(
      map(data => ({
        condominiumsCount: data.condominiums.total || 0,
        unitsCount: data.units.total || 0,
        readingsCount: data.readings.total || 0,
        usersCount: data.users.total || 0,
        metersCount: data.meters.total || 0
      }))
    );
  }

  getRecentReadings(limit = 10): Observable<RecentReading[]> {
    return this.http.get<Reading[]>(`${this.apiUrl}/readings?limit=${limit}`).pipe(
      map(readings => 
        readings.map(reading => ({
          id: reading.id,
          unit: reading.meter?.unit?.number || `Unidade ${reading.meter?.unit_id}`,
          type: reading.meter?.measurement_type?.name || 'N/A',
          value: `${reading.current_reading} ${reading.meter?.measurement_type?.unit || ''}`,
          date: new Date(reading.date),
          condominium: reading.meter?.unit?.condominium?.name || 'N/A',
          status: reading.status
        }))
      ),
      catchError(() => of([]))
    );
  }

  getMonthlyReadingsStats(): Observable<MonthlyReadingsStats[]> {
    // Buscar leituras dos últimos 6 meses
    const currentDate = new Date();
    const monthsToFetch = [];
    
    for (let i = 0; i < 6; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthsToFetch.push({
        month: monthStr,
        displayName: date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
      });
    }

    const requests = monthsToFetch.map(month => 
      this.http.get<Reading[]>(`${this.apiUrl}/readings?reference_month=${month.month}`).pipe(
        map(readings => ({
          month: month.displayName,
          count: readings.length,
          percentage: 0 // Será calculado depois
        })),
        catchError(() => of({ month: month.displayName, count: 0, percentage: 0 }))
      )
    );

    return forkJoin(requests).pipe(
      map(results => {
        const totalReadings = results.reduce((sum, result) => sum + result.count, 0);
        return results.map(result => ({
          ...result,
          percentage: totalReadings > 0 ? Math.round((result.count / totalReadings) * 100) : 0
        })).reverse(); // Mostrar do mais antigo para o mais recente
      })
    );
  }

  getReadingsByType(): Observable<ReadingsByType[]> {
    return this.http.get<MeasurementType[]>(`${this.apiUrl}/measurement-types`).pipe(
      map(types => {
        // Para cada tipo, buscar as leituras seria mais complexo
        // Por enquanto, vamos retornar dados básicos
        return types.map(type => ({
          type: type.name,
          count: Math.floor(Math.random() * 100) + 10, // Temporário - substituir por dados reais
          percentage: Math.floor(Math.random() * 30) + 10 // Temporário
        }));
      }),
      catchError(() => of([
        { type: 'Água', count: 0, percentage: 0 },
        { type: 'Energia', count: 0, percentage: 0 },
        { type: 'Gás', count: 0, percentage: 0 }
      ]))
    );
  }

  getCompletionRate(): Observable<number> {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    
    const totalMeters$ = this.http.get<{ id: number; serial_number?: string }[]>(`${this.apiUrl}/meters`);
    const currentMonthReadings$ = this.http.get<Reading[]>(`${this.apiUrl}/readings?reference_month=${currentMonth}`);

    return forkJoin({
      meters: totalMeters$.pipe(catchError(() => of([]))),
      readings: currentMonthReadings$.pipe(catchError(() => of([])))
    }).pipe(
      map(data => {
        if (data.meters.length === 0) return 0;
        return Math.round((data.readings.length / data.meters.length) * 100);
      })
    );
  }

  getDashboardAlerts(): Observable<DashboardAlerts> {
    // Por enquanto, retornamos dados simulados
    // Futuramente, implementar endpoints específicos no backend
    return of({
      overdueReadings: Math.floor(Math.random() * 10),
      inaccessibleMeters: Math.floor(Math.random() * 5),
      lowBatteryMeters: Math.floor(Math.random() * 3),
      anomalousReadings: Math.floor(Math.random() * 8)
    });
  }

  getAverageReadingValue(): Observable<number> {
    return this.http.get<Reading[]>(`${this.apiUrl}/readings?limit=100`).pipe(
      map(readings => {
        if (readings.length === 0) return 0;
        const sum = readings.reduce((acc, reading) => acc + parseFloat(reading.current_reading || '0'), 0);
        return Math.round(sum / readings.length * 100) / 100; // Duas casas decimais
      }),
      catchError(() => of(0))
    );
  }

  getFullDashboardData(): Observable<DashboardData> {
    return forkJoin({
      stats: this.getDashboardStats(),
      recentReadings: this.getRecentReadings(),
      monthlyStats: this.getMonthlyReadingsStats(),
      readingsByType: this.getReadingsByType(),
      completionRate: this.getCompletionRate(),
      averageReadingValue: this.getAverageReadingValue(),
      alerts: this.getDashboardAlerts()
    });
  }
}