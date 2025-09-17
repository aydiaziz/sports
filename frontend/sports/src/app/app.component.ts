import { Component } from '@angular/core';

import { AuthService, CurrentUser } from './auth/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  user$ = this.authService.currentUser$;

  constructor(private authService: AuthService) {}

  homeLink(user: CurrentUser | null): string {
    return this.authService.defaultRouteForRole(user?.role ?? null);
  }
}
