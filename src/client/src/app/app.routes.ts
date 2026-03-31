import { Routes } from '@angular/router';
import { SignupComponent } from './signup/signup.component';
import { SessionsComponent } from './sessions/sessions.component';

export const routes: Routes = [
  { path: 'signup', component: SignupComponent },
  { path: 'sessions', component: SessionsComponent },
  { path: '', redirectTo: '/signup', pathMatch: 'full' }
];
