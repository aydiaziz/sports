import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { JwtInterceptor } from './auth/interceptors/jwt.interceptor';
import { TenantsListComponent } from './superadmin/components/tenants-list/tenants-list.component';
import { TenantNewComponent } from './superadmin/components/tenant-new/tenant-new.component';
import { TenantDetailComponent } from './superadmin/components/tenant-detail/tenant-detail.component';
import { OwnerDashboardComponent } from './owner/components/owner-dashboard/owner-dashboard.component';
import { OwnerSettingsComponent } from './owner/components/owner-settings/owner-settings.component';
import { AcceptInviteComponent } from './onboarding/accept-invite/accept-invite.component';

@NgModule({
  declarations: [
    AppComponent,
    TenantsListComponent,
    TenantNewComponent,
    TenantDetailComponent,
    OwnerDashboardComponent,
    OwnerSettingsComponent,
    AcceptInviteComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    AppRoutingModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
