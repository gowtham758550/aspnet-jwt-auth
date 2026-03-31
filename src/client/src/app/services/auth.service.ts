import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  async login(email: string, password: string): Promise<any> {
    return this.apiCall('POST', '/login', { email, password });
  }

  async logout(refreshToken: string): Promise<any> {
    return this.apiCall('POST', '/logout', { refreshToken });
  }

  async logoutAll(token: string): Promise<any> {
    return this.apiCall('POST', '/logout-all', { token }, token);
  }

  async refresh(token: string, refreshToken: string): Promise<any> {
    return this.apiCall('POST', '/refresh', { token, refreshToken }, token);
  }

  async getMe(token?: string): Promise<any> {
    return this.apiCall('POST', '/me', {}, token);
  }

  private async apiCall(method: string, path: string, body?: any, accessToken?: string): Promise<any> {
    const url = `${this.apiUrl}/account${path}`;
    const headers: any = { 'Content-Type': 'application/json' };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });

      const data = await res.json();
      return { ok: res.ok, status: res.status, data };
    } catch (error: any) {
      return { ok: false, status: 0, data: null, error: error.message };
    }
  }

  decodeJwt(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    } catch {
      return null;
    }
  }
}
