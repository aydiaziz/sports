from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AcceptOwnerInviteView, TenantViewSet

router = DefaultRouter()
router.register('tenants', TenantViewSet, basename='tenant')

urlpatterns = [
    path('', include(router.urls)),
    path('owners/accept-invite/', AcceptOwnerInviteView.as_view(), name='owner-accept-invite'),
]
