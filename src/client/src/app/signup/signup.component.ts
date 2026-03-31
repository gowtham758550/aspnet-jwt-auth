import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AccountService } from '../services/account.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent {
  signupForm: FormGroup;
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

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
      this.loading = true;
      this.errorMessage = null;
      this.successMessage = null;

      const formData = this.signupForm.value;

      this.accountService.register(formData).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            this.successMessage = 'Account created successfully!';
            // Store tokens
            localStorage.setItem('token', response.token);
            localStorage.setItem('refreshToken', response.refreshToken);
            // Reset form
            this.signupForm.reset();
            // TODO: Redirect to sessions or dashboard
            console.log('Registration successful', response);
          } else {
            this.errorMessage = 'Registration failed. Please try again.';
          }
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'An error occurred during registration. Please try again.';
          console.error('Registration error:', error);
        }
      });
    }
  }
}
