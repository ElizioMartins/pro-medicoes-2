import { BaseEntity } from "./base.model";
import { ReadingStatus } from "./enums";
import { Meter } from "./meter.model";
import { ReadingPhoto } from "./reading-photo.model";

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


