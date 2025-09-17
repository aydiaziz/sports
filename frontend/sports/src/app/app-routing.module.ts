import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './auth/guards/auth.guard';
import { RoleGuard } from './auth/guards/role.guard';
import { TenantsListComponent } from './superadmin/components/tenants-list/tenants-list.component';
import { TenantNewComponent } from './superadmin/components/tenant-new/tenant-new.component';
import { TenantDetailComponent } from './superadmin/components/tenant-detail/tenant-detail.component';
import { OwnerDashboardComponent } from './owner/components/owner-dashboard/owner-dashboard.component';
import { OwnerSettingsComponent } from './owner/components/owner-settings/owner-settings.component';
import { AcceptInviteComponent } from './onboarding/accept-invite/accept-invite.component';

const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: 'superadmin',
    canActivate: [AuthGuard, RoleGuard],
    canActivateChild: [AuthGuard, RoleGuard],
    data: { roles: ['SUPERADMIN'] },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'tenants' },
      { path: 'tenants', component: TenantsListComponent },
      { path: 'tenants/new', component: TenantNewComponent },
      { path: 'tenants/:id', component: TenantDetailComponent },
    ],
  },
  {
    path: 'owner',
    canActivate: [AuthGuard, RoleGuard],
    canActivateChild: [AuthGuard, RoleGuard],
    data: { roles: ['OWNER'] },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: OwnerDashboardComponent },
      { path: 'settings', component: OwnerSettingsComponent },
    ],
  },
  { path: 'accept-invite/:token', component: AcceptInviteComponent },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'auth/login',
  },
  {
    path: '**',
    redirectTo: 'auth/login',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
