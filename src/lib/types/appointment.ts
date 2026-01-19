export type Appointment = {
  _id: string;
  id?: string; // Para compatibilidad
  sequence: string;
  appointment_date: string;
  client_id: string;
  vehicle_id: string;
  appointment_type: string;
  notes?: string;
  branch_id: string;
  user_id: string;
  created_by: string;
  assigned_to?: string;
  advisor_id: string;
  start_time: string;
  end_time: string;
  estimated_duration: number;
  status: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  __v?: number;
};

export type AppointmentCreateRequest = {
  sequence?: string;
  appointment_date: string;
  client_id: string;
  vehicle_id: string;
  appointment_type: string;
  notes?: string;
  branch_id: string;
  user_id: string;
  created_by: string;
  assigned_to?: string;
  advisor_id: string;
  start_time: string;
  end_time: string;
  estimated_duration: number;
  status: string;
};

export type AppointmentsResponse = {
  ok: boolean;
  message: string;
  data: Appointment[];
};

export type AppointmentCreateResponse = {
  ok: boolean;
  message: string;
  data: Appointment;
};

export type AppointmentUpdateRequest = Partial<AppointmentCreateRequest>;

export type AppointmentUpdateResponse = {
  ok: boolean;
  message: string;
  data: Appointment;
};
