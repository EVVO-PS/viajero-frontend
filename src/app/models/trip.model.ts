import { Destination } from './destination.model';

export interface Trip {
  id?: number;
  name: string;
  total_days?: number; // Ahora será calculado automáticamente
  fecha_inicio?: Date | string; // Renombramos fecha a fecha_inicio para mayor claridad
  fecha_fin?: Date | string; // Nueva propiedad
  destinations: Destination[];
  fecha?: Date | string; // Add the 'fecha' property

}