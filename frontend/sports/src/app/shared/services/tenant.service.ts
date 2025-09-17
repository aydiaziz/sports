import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { TenantDetail } from '../models/tenant.model';

interface CreateTenantPayload {
  name: string;
  slug: string;
  logo_url?: string;
  theme_primary?: string;
  theme_secondary?: string;
  address?: string;
  contact_email?: string;
  is_active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class TenantService {
  private readonly apiBase = 'http://localhost:8000/api/v1';

  constructor(private http: HttpClient) {}

  listTenants(): Observable<TenantDetail[]> {
    return this.http.get<TenantDetail[]>(`${this.apiBase}/tenants/`);
  }

  createTenant(payload: CreateTenantPayload): Observable<TenantDetail> {
    return this.http.post<TenantDetail>(`${this.apiBase}/tenants/`, payload);
  }

  getTenant(id: number): Observable<TenantDetail> {
    return this.http.get<TenantDetail>(`${this.apiBase}/tenants/${id}/`);
  }

  inviteOwner(tenantId: number, email: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(
      `${this.apiBase}/tenants/${tenantId}/invite-owner/`,
      { email }
    );
  }

  assignOwner(tenantId: number, userId: number): Observable<void> {
    return this.http.post<void>(`${this.apiBase}/tenants/${tenantId}/assign-owner/`, {
      user_id: userId,
    });
  }
}
