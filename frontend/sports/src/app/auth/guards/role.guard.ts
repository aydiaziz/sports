import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, Router, UrlTree } from '@angular/router';
import { Observable, map, switchMap } from 'rxjs';

import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate, CanActivateChild {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    return this.checkRole(route);
  }

  canActivateChild(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    return this.checkRole(route);
  }

  private checkRole(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    const roles: string[] = route.data['roles'] ?? [];
    if (roles.length === 0) {
      return this.authService.ensureProfileLoaded().pipe(
        map((loaded) => (loaded ? true : this.router.parseUrl('/auth/login')))
      );
    }

    return this.authService.ensureProfileLoaded().pipe(
      switchMap(() => this.authService.currentUser$),
      map((user) => {
        if (!user) {
          return this.router.parseUrl('/auth/login');
        }
        if (roles.includes(user.role)) {
          return true;
        }
        const fallback = this.authService.defaultRouteForRole(user.role);
        return this.router.parseUrl(fallback);
      })
    );
  }
}
