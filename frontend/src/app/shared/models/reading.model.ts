
export interface ReadingPhoto {
  id?: number;
  photo_path: string;
  created_at?: string;
}

export interface Reading extends BaseEntity {
  meter_id: number;
  current_reading: string;
  date: string;
  registered_by?: number;
  status: ReadingStatus;
  inaccessible_reason?: string;
  observations?: string;
  photos: ReadingPhoto[];
  meter?: Partial<Meter>;
}

export interface ReadingCreate {
  meter_id: number;
  current_reading: string;
  status: ReadingStatus;
  inaccessible_reason?: string;
  observations?: string;
  photos?: ReadingPhoto[];
}

export interface ReadingUpdate {
  current_reading?: string;
  status?: ReadingStatus;
  inaccessible_reason?: string;
  observations?: string;
}


