from django.contrib import admin

from .models import OwnerInvitation, Tenant


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active', 'contact_email')
    search_fields = ('name', 'slug', 'contact_email')
    list_filter = ('is_active',)


@admin.register(OwnerInvitation)
class OwnerInvitationAdmin(admin.ModelAdmin):
    list_display = ('tenant', 'email', 'status', 'expires_at', 'created_at')
    list_filter = ('status', 'tenant')
    search_fields = ('email', 'tenant__name')
