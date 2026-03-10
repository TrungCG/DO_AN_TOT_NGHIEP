export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff?: boolean;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface SignupResponse {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}
