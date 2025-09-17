import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  catchError,
  map,
  of,
  switchMap,
  tap,
  throwError,
} from 'rxjs';

import { TenantSummary } from '../../shared/models/tenant.model';

interface LoginResponse {
  access: string;
  refresh: string;
}

export interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  tenant: TenantSummary | null;
}

export interface CurrentUser {
  role: string;
  tenant: TenantSummary | null;
  profile: UserProfile;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authApiUrl = 'http://localhost:8000/auth';
  private readonly apiBaseUrl = 'http://localhost:8000/api/v1';
  private readonly accessTokenKey = 'sports_access_token';
  private readonly refreshTokenKey = 'sports_refresh_token';
  private readonly userKey = 'sports_current_user';

  private currentUserSubject = new BehaviorSubject<CurrentUser | null>(this.readStoredUser());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    if (this.getAccessToken() && !this.currentUserSubject.value) {
      this.loadProfile().subscribe({
        next: (profile) => this.setCurrentUser(profile),
        error: () => this.clearSession(),
      });
    }
  }

  login(email: string, password: string): Observable<void> {
    return this.http
      .post<LoginResponse>(`${this.authApiUrl}/login/`, {
        email,
        password,
      })
      .pipe(
        tap((tokens) => this.storeTokens(tokens.access, tokens.refresh)),
        switchMap(() => this.loadProfile()),
        tap((profile) => this.setCurrentUser(profile)),
        tap((profile) => this.router.navigate([this.defaultRouteForRole(profile.role)])),
        map(() => void 0),
        catchError((error) => {
          this.clearSession();
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  ensureProfileLoaded(): Observable<boolean> {
    if (!this.isAuthenticated()) {
      this.clearSession();
      return of(false);
    }

    if (this.currentUserSubject.value) {
      return of(true);
    }

    return this.loadProfile().pipe(
      tap((profile) => this.setCurrentUser(profile)),
      map(() => true),
      catchError(() => {
        this.clearSession();
        return of(false);
      })
    );
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  refreshTokens(): Observable<string | null> {
    const refresh = this.getRefreshToken();
    if (!refresh) {
      return of(null);
    }

    return this.http
      .post<{ access: string; refresh?: string }>(`${this.authApiUrl}/refresh/`, { refresh })
      .pipe(
        tap((response) => this.storeTokens(response.access, response.refresh ?? refresh)),
        map((response) => response.access),
        catchError((error) => {
          this.clearSession();
          return throwError(() => error);
        })
      );
  }

  defaultRouteForRole(role?: string | null): string {
    switch (role) {
      case 'SUPERADMIN':
        return '/superadmin/tenants';
      case 'OWNER':
        return '/owner/dashboard';
      default:
        return '/auth/login';
    }
  }

  private loadProfile(): Observable<CurrentUser> {
    return this.http
      .get<CurrentUser>(`${this.apiBaseUrl}/me/`)
      .pipe(tap((profile) => this.storeUser(profile)));
  }

  private storeTokens(access: string, refresh: string): void {
    localStorage.setItem(this.accessTokenKey, access);
    localStorage.setItem(this.refreshTokenKey, refresh);
  }

  private storeUser(profile: CurrentUser): void {
    localStorage.setItem(this.userKey, JSON.stringify(profile));
  }

  private readStoredUser(): CurrentUser | null {
    const raw = localStorage.getItem(this.userKey);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as CurrentUser;
    } catch (error) {
      localStorage.removeItem(this.userKey);
      return null;
    }
  }

  private setCurrentUser(profile: CurrentUser | null): void {
    this.currentUserSubject.next(profile);
    if (profile) {
      this.storeUser(profile);
    }
  }

  private clearSession(): void {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
  }
}
