import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { TenantDetail } from '../../../shared/models/tenant.model';
import { TenantService } from '../../../shared/services/tenant.service';

@Component({
  selector: 'app-tenant-detail',
  templateUrl: './tenant-detail.component.html',
  styleUrls: ['./tenant-detail.component.css'],
})
export class TenantDetailComponent implements OnInit {
  tenant?: TenantDetail;
  loading = false;
  error?: string;
  info?: string;

  constructor(private tenantService: TenantService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadTenant(id);
    }
  }

  loadTenant(id: number): void {
    this.loading = true;
    this.error = undefined;
    this.info = undefined;

    this.tenantService.getTenant(id).subscribe({
      next: (tenant) => {
        this.tenant = tenant;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Impossible de charger le tenant.';
      },
    });
  }

  inviteOwner(): void {
    if (!this.tenant) {
      return;
    }
    const email = prompt('Email de l\'owner à inviter :');
    if (!email) {
      return;
    }

    this.tenantService.inviteOwner(this.tenant.id, email).subscribe({
      next: (invitation) => {
        this.info = `Invitation envoyée ! Token: ${invitation.token}`;
      },
      error: () => {
        this.error = "Impossible d'envoyer l'invitation.";
      },
    });
  }
}
