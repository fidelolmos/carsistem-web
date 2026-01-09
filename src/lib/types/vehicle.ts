export type Vehicle = {
  _id: string;
  id?: string; // Para compatibilidad
  client_id: string;
  economico: string;
  license: string;
  vin: string;
  model: string;
  brand: string;
  year: number;
  tipo: string;
  fuelType: string;
  odometer: number;
  fleet: boolean;
  projectId?: string;
  advisor?: string;
  metadata?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  __v?: number;
};

export type VehicleCreateRequest = {
  client_id: string;
  economico: string;
  license: string;
  vin: string;
  model: string;
  brand: string;
  year: number;
  tipo: string;
  fuelType: string;
  odometer: number;
  fleet: boolean;
  projectId?: string;
  advisor?: string;
  metadata?: string;
};

export type VehicleUpdateRequest = VehicleCreateRequest;

export type VehiclesResponse = {
  ok: boolean;
  message: string;
  data: Vehicle[];
};

export type VehicleCreateResponse = {
  ok: boolean;
  message: string;
  data: Vehicle;
};
