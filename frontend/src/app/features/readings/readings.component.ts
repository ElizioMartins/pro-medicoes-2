import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { Observable, tap } from 'rxjs'; // Import Observable and tap

// Import Services
import { ReadingService } from '@core/services/Reading.service';
import { MeasurementTypeService } from '@core/services/MeasurementType.service';
import { CondominiumService } from '@core/services/Condominium.service';

// Import Models
import { Reading } from '@core/models/Reading';
import { MeasurementType } from '@core/models/MeasurementType';
import { Condominium } from '@core/models/Condominium';

@Component({
  selector: 'app-readings',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    ButtonComponent,
    RouterLink,
    FormsModule 
  ],
  templateUrl: './readings.component.html',
  styleUrls: ['./readings.component.scss']
})
export class ReadingsComponent implements OnInit {
  allReadings: Reading[] = [];
  filteredReadings: Reading[] = [];
  paginatedReadings: Reading[] = [];
  
  condominiums: Condominium[] = [];
  measurementTypes: MeasurementType[] = [];

  isLoading = true;
  error: string | null = null;
    // Filter selections
  selectedCondominiumId: number | null = null;
  selectedMeasurementTypeId: number | null = null;
  selectedPeriod: string = "all";

  // Pagination
  currentPage = 1;
  itemsPerPage = 5; // Or any other number you prefer
  totalPages = 1;

  constructor(
    private readingService: ReadingService,
    private measurementTypeService: MeasurementTypeService,
    private condominiumService: CondominiumService
  ) {}
  
  ngOnInit(): void {
    this.isLoading = true;
    this.error = null;
    // Fetch all necessary data
    this.condominiumService.getCondominiums().subscribe({
      next: data => this.condominiums = data,
      error: err => console.error('Error fetching condominiums', err) // Basic error handling
    });

    this.measurementTypeService.getMeasurementTypes().subscribe({
      next: data => this.measurementTypes = data,
      error: err => console.error('Error fetching measurement types', err) // Basic error handling
    });

    this.readingService.getReadings().subscribe({
      next: data => {
        this.allReadings = data;
        this.applyFilters(); // Apply initial filters (which might be none)
        this.isLoading = false;
      },
      error: err => {
        console.error('Error fetching readings', err);
        this.error = 'Falha ao carregar as leituras. Tente novamente mais tarde.';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    let readings = [...this.allReadings];

    if (this.selectedCondominiumId) {
      readings = readings.filter(r => r.meter?.unit?.condominiumId === Number(this.selectedCondominiumId));
    }

    if (this.selectedMeasurementTypeId) {
      readings = readings.filter(r => r.meter?.measurementTypeId === Number(this.selectedMeasurementTypeId));
    }
    
    if (this.selectedPeriod !== "all") {
      const now = new Date();
      // Create a new date object for cutoffDate to avoid modifying 'now' in-place with setDate
      const cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const daysToSubtract = parseInt(this.selectedPeriod, 10);
      cutoffDate.setDate(cutoffDate.getDate() - daysToSubtract); // Correctly subtract days
      
      readings = readings.filter(r => {
        const readingDate = new Date(r.date);
        return readingDate >= cutoffDate;
      });
    }

    this.filteredReadings = readings;
    this.currentPage = 1; // Reset to first page after filtering
    this.updatePaginatedReadings();
  }
  clearFilters(): void {
    this.selectedCondominiumId = null;
    this.selectedMeasurementTypeId = null;
    this.selectedPeriod = "all";
    this.applyFilters();
  }

  updatePaginatedReadings(): void {
    this.totalPages = Math.ceil(this.filteredReadings.length / this.itemsPerPage);
    if (this.totalPages === 0) this.totalPages = 1; // Ensure totalPages is at least 1

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedReadings = this.filteredReadings.slice(startIndex, startIndex + this.itemsPerPage);
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedReadings();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedReadings();
    }
  }
}
