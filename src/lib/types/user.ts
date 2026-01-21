export type User = {
  _id: string;
  id?: string; // Para compatibilidad
  email: string;
  username: string;
  full_name: string;
  role: string;
  branch_id: string;
  permissions: string[];
  status: string;
  failed_login_attempts?: number;
  is_locked?: boolean;
  last_login_at?: string | null;
  locked_at?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  __v?: number;
};

/** Payload para POST /users según documentación del backend. No incluir permissions ni status. */
export type UserCreateRequest = {
  email: string;
  password: string;
  username: string;
  full_name: string;
  branch_id: string;
  role: string;
};

export type UserUpdateRequest = {
  email?: string;
  username?: string;
  full_name?: string;
  branch_id?: string;
  role?: string;
  password?: string;
  permissions?: string[];
  status?: string;
};

export type UsersResponse = {
  ok: boolean;
  message: string;
  data: User[];
};

export type UserCreateResponse = {
  ok: boolean;
  message: string;
  data: User;
};
