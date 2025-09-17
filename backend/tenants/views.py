from __future__ import annotations

import logging

from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsSuperAdmin

from .models import Tenant
from .serializers import (
    AcceptOwnerInviteSerializer,
    AssignOwnerSerializer,
    OwnerInvitationResponseSerializer,
    OwnerInviteSerializer,
    TenantDetailSerializer,
    TenantSerializer,
)


logger = logging.getLogger(__name__)
User = get_user_model()


class TenantViewSet(viewsets.ModelViewSet):
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer

    def get_queryset(self):
        queryset = (
            Tenant.objects.all()
            .annotate(
                owners_count=Count('users', filter=Q(users__role=User.Role.OWNER))
            )
            .order_by('name')
        )
        user = self.request.user
        if not user.is_authenticated:
            return queryset.none()
        if user.role == User.Role.SUPERADMIN:
            return queryset
        if user.role == User.Role.OWNER and user.tenant_id:
            return queryset.filter(id=user.tenant_id)
        return queryset.none()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TenantDetailSerializer
        return super().get_serializer_class()

    def get_permissions(self):
        if self.action in {'list', 'create', 'invite_owner', 'assign_owner'}:
            permission_classes = [IsSuperAdmin]
        elif self.action == 'retrieve':
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    @action(detail=True, methods=['post'], url_path='invite-owner', permission_classes=[IsSuperAdmin])
    def invite_owner(self, request, pk=None):
        tenant = self.get_object()
        serializer = OwnerInviteSerializer(data=request.data, context={'tenant': tenant})
        serializer.is_valid(raise_exception=True)
        invitation = serializer.save()

        logger.info('Mock sending owner invitation to %s with token %s', invitation.email, invitation.token)

        response_serializer = OwnerInvitationResponseSerializer(invitation)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='assign-owner', permission_classes=[IsSuperAdmin])
    def assign_owner(self, request, pk=None):
        tenant = self.get_object()
        serializer = AssignOwnerSerializer(data=request.data, context={'tenant': tenant})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def list(self, request, *args, **kwargs):
        if request.user.role != User.Role.SUPERADMIN:
            return Response(status=status.HTTP_403_FORBIDDEN)
        return super().list(request, *args, **kwargs)


class AcceptOwnerInviteView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = AcceptOwnerInviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({'message': 'Invitation accepted', 'email': user.email}, status=status.HTTP_201_CREATED)
