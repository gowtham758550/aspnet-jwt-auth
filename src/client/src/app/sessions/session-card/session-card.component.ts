import { Component, DestroyRef, inject, input, OnDestroy, OnInit, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthSession } from '../sessions.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-session-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './session-card.component.html',
  styleUrl: './session-card.component.scss'
})
export class SessionCardComponent implements OnInit, OnDestroy {
  readonly session = input.required<AuthSession>();
  readonly removeSession = output<void>();
  readonly emailControl = new FormControl('', { nonNullable: true });
  readonly passwordControl = new FormControl('', { nonNullable: true });

  private readonly destroyRef = inject(DestroyRef);
  private expiryInterval: any;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    const session = this.session();
    this.emailControl.setValue(session.email);
    this.passwordControl.setValue(session.password);

    this.emailControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.session().email = value;
      });

    this.passwordControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.session().password = value;
      });

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
    const session = this.session();
    session.email = this.emailControl.value;
    session.password = this.passwordControl.value;
    const result = await this.authService.login(this.emailControl.value, this.passwordControl.value);

    if (result.ok && result.data) {
      session.accessToken = result.data.token;
      session.refreshToken = result.data.refreshToken;
      session.decodedAccess = this.decodeJwt(result.data.token);
      session.decodedRefresh = this.decodeJwt(result.data.refreshToken);

      this.logEntry(`POST /login → ${result.status}`, 'success');

      // Fetch user info
      const meResult = await this.authService.getMe(session.accessToken ?? '');
      if (meResult.ok && meResult.data) {
        session.user = meResult.data;
        session.status = 'logged-in';
        this.logEntry(`POST /me → ${meResult.status}`, 'success');
      }
    } else {
      this.logEntry(`POST /login → ${result.status || 'Error'}`, 'error');
    }
  }

  async logout() {
    const session = this.session();
    const result = await this.authService.logout(session.refreshToken || '');

    if (result.ok) {
      session.accessToken = null;
      session.refreshToken = null;
      session.decodedAccess = null;
      session.decodedRefresh = null;
      session.user = null;
      session.status = 'idle';
      this.logEntry(`POST /logout → ${result.status}`, 'success');
    } else {
      this.logEntry(`POST /logout → ${result.status || 'Error'}`, 'error');
    }
  }

  async logoutAll() {
    const session = this.session();
    const result = await this.authService.logoutAll(session.accessToken || '');

    if (result.ok) {
      session.accessToken = null;
      session.refreshToken = null;
      session.decodedAccess = null;
      session.decodedRefresh = null;
      session.user = null;
      session.status = 'idle';
      this.logEntry(`POST /logout-all → ${result.status}`, 'success');
    } else {
      this.logEntry(`POST /logout-all → ${result.status || 'Error'}`, 'error');
    }
  }

  async refresh() {
    const session = this.session();
    const result = await this.authService.refresh(
      session.accessToken || '',
      session.refreshToken || ''
    );

    if (result.ok && result.data) {
      session.accessToken = result.data.token;
      session.decodedAccess = this.decodeJwt(result.data.token);
      session.status = 'logged-in';
      this.logEntry(`POST /refresh → ${result.status}`, 'success');
    } else {
      this.logEntry(`POST /refresh → ${result.status || 'Error'}`, 'error');
    }
  }

  async getMe() {
    const session = this.session();
    const result = await this.authService.getMe(session.accessToken || '');
    if (result.ok && result.data) {
      session.user = result.data;
      this.logEntry(`POST /me → ${result.status}`, 'success');
    } else {
      this.logEntry(`POST /me → ${result.status || 'Error'}`, 'error');
    }
  }

  // ========== LOGGING ==========
  logEntry(message: string, type: string = 'info') {
    const session = this.session();
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    session.log.unshift({ time, message, type });
    if (session.log.length > 15) {
      session.log.pop();
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
      const session = this.session();
      if (session.decodedAccess) {
        const info = this.getExpiryInfo(session.decodedAccess);
        if (info.status === 'expired' && session.status !== 'expired') {
          session.status = 'expired';
        }
      }
    }, 1000);
  }

  // ========== UTILITIES ==========
  getSessionLabel(): string {
    const letter = this.session().id.split('-')[1].toUpperCase();
    return `SESSION ${letter}`;
  }

  getStatusText(): string {
    const statusMap: any = {
      'idle': 'Not logged in',
      'logged-in': 'Logged in',
      'expired': 'Token expired'
    };
    return statusMap[this.session().status];
  }

  getStatusDotClass(): string {
    const statusMap: any = {
      'idle': 'idle',
      'logged-in': 'logged-in',
      'expired': 'expired'
    };
    return statusMap[this.session().status];
  }

  getInitials(): string {
    const session = this.session();
    if (!session.user || !session.user.name) return '?';
    const parts = session.user.name.split(' ').filter((p: string | any[]) => p.length > 0);
    const initials = parts.slice(0, 2).map((p: any[]) => p[0]).join('');
    return initials.toUpperCase() || '?';
  }

  getFullName(): string {
    const user = this.session().user;
    if (!user) return '';
    return user.name || '';
  }

  isLoggedIn(): boolean {
    return this.session().status === 'logged-in';
  }

  getTokenPreview(token: string | null): string {
    if (!token) return '';
    return token.substring(0, 20) + '…';
  }
}
