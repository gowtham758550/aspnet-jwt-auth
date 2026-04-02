import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AccountService } from '../services/account.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent {
  signupForm: FormGroup;
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private accountService: AccountService
  ) {
    this.signupForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      firstName: [''],
      lastName: ['']
    });
  }

  onSubmit() {
    if (this.signupForm.valid) {
      this.loading.set(true);
      this.errorMessage.set(null);
      this.successMessage.set(null);

      const formData = this.signupForm.value;

      this.accountService.register(formData).subscribe({
        next: (response) => {
          this.loading.set(false);
          if (response.success) {
            this.successMessage.set('Account created successfully!');
            // Store tokens
            localStorage.setItem('token', response.token);
            localStorage.setItem('refreshToken', response.refreshToken);
            // Reset form
            this.signupForm.reset();
            // TODO: Redirect to sessions or dashboard
            console.log('Registration successful', response);
          } else {
            this.errorMessage.set('Registration failed. Please try again.');
          }
        },
        error: (error) => {
          this.loading.set(false);
          this.errorMessage.set(
            error.error?.message || 'An error occurred during registration. Please try again.'
          );
          console.error('Registration error:', error);
        }
      });
    }
  }
}
