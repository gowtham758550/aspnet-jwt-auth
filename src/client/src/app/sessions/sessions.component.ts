import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SessionCardComponent } from './session-card/session-card.component';

export interface AuthSession {
  id: string;
  color: string;
  email: string;
  password: string;
  status: 'idle' | 'logged-in' | 'expired';
  accessToken: string | null;
  refreshToken: string | null;
  decodedAccess: any;
  decodedRefresh: any;
  user: any;
  log: Array<{ time: string; message: string; type: string }>;
}

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [FormsModule, SessionCardComponent],
  templateUrl: './sessions.component.html',
  styleUrl: './sessions.component.scss'
})
export class SessionsComponent implements OnInit {
  readonly sessions = signal<AuthSession[]>([]);

  private sessionCounter = 0;
  private readonly PALETTE = [
    '#85B7EB',  // blue
    '#5DCAA5',  // teal
    '#F0997B',  // coral
    '#AFA9EC',  // purple
    '#FAC775',  // amber
    '#ED93B1',  // pink
  ];

  ngOnInit() {
    this.addSession();
  }

  addSession() {
    const currentSessions = this.sessions();
    const session: AuthSession = {
      id: `session-${++this.sessionCounter}`,
      color: this.PALETTE[currentSessions.length % this.PALETTE.length],
      email: '',
      password: '',
      status: 'idle',
      accessToken: null,
      refreshToken: null,
      decodedAccess: null,
      decodedRefresh: null,
      user: null,
      log: []
    };
    this.sessions.update((sessions) => [...sessions, session]);
  }

  removeSession(sessionId: string) {
    this.sessions.update((sessions) => sessions.filter((session) => session.id !== sessionId));
  }
}
