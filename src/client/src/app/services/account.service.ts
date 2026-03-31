import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  RegisterRequest,
  LoginRequest,
  RefreshRequest,
  LogoutRequest,
  LogoutAllRequest,
  AuthResponse
} from '../models/account.model';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private apiUrl = `${environment.apiUrl}/account`;

  constructor(private http: HttpClient) {}

  /**
   * Register a new user account
   * @param request RegisterRequest payload
   * @returns Observable of AuthResponse
   */
  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signup`, request);
  }

  /**
   * Login with email and password
   * @param request LoginRequest payload
   * @returns Observable of AuthResponse
   */
  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request);
  }

  /**
   * Refresh the authentication token
   * @param request RefreshRequest payload
   * @returns Observable of AuthResponse
   */
  refresh(request: RefreshRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, request);
  }

  /**
   * Logout the current session
   * @param request LogoutRequest payload
   * @returns Observable of any response
   */
  logout(request: LogoutRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, request);
  }

  /**
   * Logout from all sessions
   * @param request LogoutAllRequest payload
   * @returns Observable of any response
   */
  logoutAll(request: LogoutAllRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout-all`, request);
  }
}
