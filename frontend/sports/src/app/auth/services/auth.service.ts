import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, map, of, switchMap, tap, throwError } from 'rxjs';

export interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  tenant: string;
}

interface LoginResponse {
  access: string;
  refresh: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = 'http://localhost:8000/auth';
  private readonly accessTokenKey = 'sports_access_token';
  private readonly refreshTokenKey = 'sports_refresh_token';
  private readonly userKey = 'sports_current_user';

  private currentUserSubject = new BehaviorSubject<UserProfile | null>(this.readStoredUser());
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
      .post<LoginResponse & { email: string; role: string; tenant: string }>(`${this.apiUrl}/login/`, {
        email,
        password,
      })
      .pipe(
        tap((tokens) => this.storeTokens(tokens.access, tokens.refresh)),
        switchMap(() => this.loadProfile()),
        tap((profile) => this.setCurrentUser(profile)),
        tap(() => this.router.navigate(['/dashboard'])),
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
      .post<{ access: string; refresh?: string }>(`${this.apiUrl}/refresh/`, { refresh })
      .pipe(
        tap((response) => this.storeTokens(response.access, response.refresh ?? refresh)),
        map((response) => response.access),
        catchError((error) => {
          this.clearSession();
          return throwError(() => error);
        })
      );
  }

  private loadProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/me/`).pipe(
      tap((profile) => this.storeUser(profile))
    );
  }

  private storeTokens(access: string, refresh: string): void {
    localStorage.setItem(this.accessTokenKey, access);
    localStorage.setItem(this.refreshTokenKey, refresh);
  }

  private storeUser(profile: UserProfile): void {
    localStorage.setItem(this.userKey, JSON.stringify(profile));
  }

  private readStoredUser(): UserProfile | null {
    const raw = localStorage.getItem(this.userKey);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as UserProfile;
    } catch (error) {
      localStorage.removeItem(this.userKey);
      return null;
    }
  }

  private setCurrentUser(profile: UserProfile | null): void {
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
