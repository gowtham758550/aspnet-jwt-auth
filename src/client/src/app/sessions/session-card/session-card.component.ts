import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthSession } from '../sessions.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-session-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './session-card.component.html',
  styleUrl: './session-card.component.scss'
})
export class SessionCardComponent implements OnInit, OnDestroy {
  @Input() session!: AuthSession;
  @Output() removeSession = new EventEmitter<void>();

  private expiryInterval: any;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.startExpiryCountdown();
  }

  ngOnDestroy() {
    if (this.expiryInterval) {
      clearInterval(this.expiryInterval);
    }
  }

  // ========== JWT DECODING ==========
  private decodeJwt(token: string): any {
    return this.authService.decodeJwt(token);
  }

  async login() {
    const result = await this.authService.login(this.session.email, this.session.password);

    if (result.ok && result.data) {
      this.session.accessToken = result.data.token;
      this.session.refreshToken = result.data.refreshToken;
      this.session.decodedAccess = this.decodeJwt(result.data.token);
      this.session.decodedRefresh = this.decodeJwt(result.data.refreshToken);

      this.logEntry(`POST /login → ${result.status}`, 'success');

      // Fetch user info
      const meResult = await this.authService.getMe(this.session.accessToken ?? '');
      if (meResult.ok && meResult.data) {
        this.session.user = meResult.data;
        this.session.status = 'logged-in';
        this.logEntry(`POST /me → ${meResult.status}`, 'success');
      }
    } else {
      this.logEntry(`POST /login → ${result.status || 'Error'}`, 'error');
    }
  }

  async logout() {
    const result = await this.authService.logout(this.session.refreshToken || '');

    if (result.ok) {
      this.session.accessToken = null;
      this.session.refreshToken = null;
      this.session.decodedAccess = null;
      this.session.decodedRefresh = null;
      this.session.user = null;
      this.session.status = 'idle';
      this.logEntry(`POST /logout → ${result.status}`, 'success');
    } else {
      this.logEntry(`POST /logout → ${result.status || 'Error'}`, 'error');
    }
  }

  async logoutAll() {
    const result = await this.authService.logoutAll(this.session.accessToken || '');

    if (result.ok) {
      this.session.accessToken = null;
      this.session.refreshToken = null;
      this.session.decodedAccess = null;
      this.session.decodedRefresh = null;
      this.session.user = null;
      this.session.status = 'idle';
      this.logEntry(`POST /logout-all → ${result.status}`, 'success');
    } else {
      this.logEntry(`POST /logout-all → ${result.status || 'Error'}`, 'error');
    }
  }

  async refresh() {
    const result = await this.authService.refresh(
      this.session.accessToken || '',
      this.session.refreshToken || ''
    );

    if (result.ok && result.data) {
      this.session.accessToken = result.data.token;
      this.session.decodedAccess = this.decodeJwt(result.data.token);
      this.session.status = 'logged-in';
      this.logEntry(`POST /refresh → ${result.status}`, 'success');
    } else {
      this.logEntry(`POST /refresh → ${result.status || 'Error'}`, 'error');
    }
  }

  async getMe() {
    const result = await this.authService.getMe(this.session.accessToken || '');
    if (result.ok && result.data) {
      this.session.user = result.data;
      this.logEntry(`POST /me → ${result.status}`, 'success');
    } else {
      this.logEntry(`POST /me → ${result.status || 'Error'}`, 'error');
    }
  }

  // ========== LOGGING ==========
  logEntry(message: string, type: string = 'info') {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    this.session.log.unshift({ time, message, type });
    if (this.session.log.length > 15) {
      this.session.log.pop();
    }
  }

  // ========== EXPIRY MANAGEMENT ==========
  getExpiryInfo(decodedToken: any): { status: string; remaining: number; text: string } {
    if (!decodedToken || !decodedToken.exp) {
      return { status: 'unknown', remaining: 0, text: 'Unknown' };
    }

    const now = Math.floor(Date.now() / 1000);
    const remaining = decodedToken.exp - now;

    if (remaining <= 0) {
      return { status: 'expired', remaining: 0, text: 'Expired' };
    }

    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;

    let text = '';
    if (hours > 0) text = `${hours}h ${minutes}m`;
    else if (minutes > 0) text = `${minutes}m ${seconds}s`;
    else text = `${seconds}s`;

    return { status: 'valid', remaining, text };
  }

  private startExpiryCountdown() {
    this.expiryInterval = setInterval(() => {
      if (this.session.decodedAccess) {
        const info = this.getExpiryInfo(this.session.decodedAccess);
        if (info.status === 'expired' && this.session.status !== 'expired') {
          this.session.status = 'expired';
        }
      }
    }, 1000);
  }

  // ========== UTILITIES ==========
  getSessionLabel(): string {
    const letter = this.session.id.split('-')[1].toUpperCase();
    return `SESSION ${letter}`;
  }

  getStatusText(): string {
    const statusMap: any = {
      'idle': 'Not logged in',
      'logged-in': 'Logged in',
      'expired': 'Token expired'
    };
    return statusMap[this.session.status];
  }

  getStatusDotClass(): string {
    const statusMap: any = {
      'idle': 'idle',
      'logged-in': 'logged-in',
      'expired': 'expired'
    };
    return statusMap[this.session.status];
  }

  getInitials(): string {
    if (!this.session.user || !this.session.user.name) return '?';
    const parts = this.session.user.name.split(' ').filter((p: string | any[]) => p.length > 0);
    const initials = parts.slice(0, 2).map((p: any[]) => p[0]).join('');
    return initials.toUpperCase() || '?';
  }

  getFullName(): string {
    if (!this.session.user) return '';
    return this.session.user.name || '';
  }

  isLoggedIn(): boolean {
    return this.session.status === 'logged-in';
  }

  getTokenPreview(token: string | null): string {
    if (!token) return '';
    return token.substring(0, 20) + '…';
  }
}
