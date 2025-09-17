import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface AcceptInvitePayload {
  token: string;
  password: string;
  first_name: string;
  last_name: string;
}

@Injectable({ providedIn: 'root' })
export class OwnerOnboardingService {
  private readonly apiBase = 'http://localhost:8000/api/v1';

  constructor(private http: HttpClient) {}

  acceptInvite(payload: AcceptInvitePayload): Observable<{ message: string; email: string }> {
    return this.http.post<{ message: string; email: string }>(
      `${this.apiBase}/owners/accept-invite/`,
      payload
    );
  }
}
