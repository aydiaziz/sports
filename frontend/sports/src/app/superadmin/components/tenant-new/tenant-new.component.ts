import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { TenantService } from '../../../shared/services/tenant.service';

@Component({
  selector: 'app-tenant-new',
  templateUrl: './tenant-new.component.html',
  styleUrls: ['./tenant-new.component.css'],
})
export class TenantNewComponent {
  error?: string;
  loading = false;

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    slug: ['', Validators.required],
    contact_email: ['', [Validators.required, Validators.email]],
    logo_url: [''],
    theme_primary: [''],
    theme_secondary: [''],
    address: [''],
    is_active: [true],
  });

  constructor(private fb: FormBuilder, private tenantService: TenantService, private router: Router) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = undefined;

    this.tenantService.createTenant(this.form.getRawValue()).subscribe({
      next: (tenant) => {
        this.loading = false;
        this.router.navigate(['/superadmin/tenants', tenant.id]);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.detail ?? 'Impossible de créer le tenant.';
      },
    });
  }
}
