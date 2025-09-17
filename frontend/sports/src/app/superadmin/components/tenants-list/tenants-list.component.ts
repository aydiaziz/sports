import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { TenantDetail } from '../../../shared/models/tenant.model';
import { TenantService } from '../../../shared/services/tenant.service';

@Component({
  selector: 'app-tenants-list',
  templateUrl: './tenants-list.component.html',
  styleUrls: ['./tenants-list.component.css'],
})
export class TenantsListComponent implements OnInit {
  tenants: TenantDetail[] = [];
  loading = false;
  error?: string;

  constructor(private tenantService: TenantService, private router: Router) {}

  ngOnInit(): void {
    this.fetchTenants();
  }

  fetchTenants(): void {
    this.loading = true;
    this.error = undefined;
    this.tenantService.listTenants().subscribe({
      next: (tenants) => {
        this.tenants = tenants;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Impossible de charger les tenants.';
      },
    });
  }

  goToTenant(id: number): void {
    this.router.navigate(['/superadmin/tenants', id]);
  }

  createTenant(): void {
    this.router.navigate(['/superadmin/tenants/new']);
  }
}
