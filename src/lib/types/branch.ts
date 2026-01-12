export type Branch = {
  id: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  metadata: string;
  created_at?: string;
  updated_at?: string;
};

export type BranchCreateRequest = {
  code: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  metadata: string;
};

export type BranchUpdateRequest = BranchCreateRequest;

export type BranchesResponse = {
  ok: boolean;
  message: string;
  data: Branch[];
};

export type BranchCreateResponse = {
  ok: boolean;
  message: string;
  data: Branch;
};

export type BranchDeleteResponse = {
  ok: boolean;
  message: string;
  data: null;
};
