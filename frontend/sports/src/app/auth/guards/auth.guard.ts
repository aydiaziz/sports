import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, map } from 'rxjs';

import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> | boolean | UrlTree {
    if (!this.authService.isAuthenticated()) {
      return this.router.parseUrl('/auth/login');
    }

    return this.authService.ensureProfileLoaded().pipe(
      map((isLoaded) => (isLoaded ? true : this.router.parseUrl('/auth/login')))
    );
  }
}
