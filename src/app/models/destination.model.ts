export interface Destination {
  id?: number;
  trip_id: number;
  name: string;
  country: string;
  days: number;
  fecha_inicio?: Date | string;
  fecha_fin?: Date | string;
}