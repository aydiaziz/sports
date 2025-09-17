import { Component } from '@angular/core';
import { Observable, map } from 'rxjs';

import { AuthService, UserProfile } from '../../../auth/services/auth.service';
import { TenantSummary } from '../../../shared/models/tenant.model';

@Component({
  selector: 'app-owner-settings',
  templateUrl: './owner-settings.component.html',
  styleUrls: ['./owner-settings.component.css'],
})
export class OwnerSettingsComponent {
  tenant$: Observable<TenantSummary | null>;
  profile$: Observable<UserProfile | null>;

  constructor(private authService: AuthService) {
    this.tenant$ = this.authService.currentUser$.pipe(map((user) => user?.tenant ?? null));
    this.profile$ = this.authService.currentUser$.pipe(map((user) => user?.profile ?? null));
  }
}
