import { Component } from '@angular/core';
import { Observable } from 'rxjs';

import { AuthService, CurrentUser } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-owner-dashboard',
  templateUrl: './owner-dashboard.component.html',
  styleUrls: ['./owner-dashboard.component.css'],
})
export class OwnerDashboardComponent {
  user$: Observable<CurrentUser | null>;

  constructor(private authService: AuthService) {
    this.user$ = this.authService.currentUser$;
  }
}
