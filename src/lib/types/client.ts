export type Client = {
  _id: string;
  id?: string; // Para compatibilidad
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  preferredContact: string;
  isActive: boolean;
  legalName?: string;
  taxId: string;
  taxRegime: string;
  cfdiUse: string;
  billingEmail: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  __v?: number;
};

export type ClientCreateRequest = {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  preferredContact: string;
  isActive: boolean;
  legalName?: string;
  taxId: string;
  taxRegime: string;
  cfdiUse: string;
  billingEmail: string;
};

export type ClientUpdateRequest = ClientCreateRequest;

export type ClientsResponse = {
  ok: boolean;
  message: string;
  data: Client[];
};

export type ClientCreateResponse = {
  ok: boolean;
  message: string;
  data: Client;
};
