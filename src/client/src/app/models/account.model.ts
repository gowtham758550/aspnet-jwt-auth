// Account-related API interfaces

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string | null;
  lastName?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  token: string;
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface LogoutAllRequest {
  token: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  refreshToken: string;
}
