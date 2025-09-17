import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { OwnerOnboardingService } from '../../shared/services/owner-onboarding.service';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-accept-invite',
  templateUrl: './accept-invite.component.html',
  styleUrls: ['./accept-invite.component.css'],
})
export class AcceptInviteComponent implements OnInit {
  token = '';
  loading = false;
  error?: string;

  form = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private onboardingService: OwnerOnboardingService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
    if (!this.token) {
      this.error = "Le lien d'invitation est invalide.";
    }
  }

  submit(): void {
    if (!this.token) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = undefined;

    const payload = {
      token: this.token,
      ...this.form.getRawValue(),
    };

    this.onboardingService.acceptInvite(payload).subscribe({
      next: (response) => {
        this.authService.login(response.email, payload.password).subscribe({
          next: () => {
            this.loading = false;
          },
          error: (err) => {
            this.loading = false;
            this.error = err?.error?.detail ?? 'Compte créé mais connexion impossible.';
          },
        });
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.token ?? err?.error?.detail ?? 'Impossible de finaliser votre inscription.';
      },
    });
  }
}
