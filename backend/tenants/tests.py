from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import OwnerInvitation, Tenant


User = get_user_model()


class TenantPermissionsTests(APITestCase):
    def setUp(self):
        self.superadmin = User.objects.create_superuser('admin@example.com', 'AdminPass123!')
        self.tenant = Tenant.objects.create(
            name='Test Club', slug='test-club', contact_email='contact@testclub.com'
        )
        self.owner = User.objects.create_user(
            email='owner@example.com',
            password='OwnerPass123!',
            role=User.Role.OWNER,
            tenant=self.tenant,
        )

    def test_superadmin_can_list_tenants(self):
        self.client.force_authenticate(self.superadmin)
        response = self.client.get('/api/v1/tenants/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 1)

    def test_owner_cannot_list_tenants(self):
        self.client.force_authenticate(self.owner)
        response = self.client.get('/api/v1/tenants/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class OwnerInvitationAcceptanceTests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(
            name='Invited Club', slug='invited-club', contact_email='hello@club.com'
        )
        self.invitation = OwnerInvitation.objects.create(
            tenant=self.tenant,
            email='new-owner@example.com',
        )

    def test_accept_invitation_creates_owner_and_marks_invitation(self):
        payload = {
            'token': self.invitation.token,
            'password': 'StrongPass123!',
            'first_name': 'Alex',
            'last_name': 'Morgan',
        }

        response = self.client.post('/api/v1/owners/accept-invite/', payload)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()['email'], 'new-owner@example.com')

        user = User.objects.get(email='new-owner@example.com')
        self.assertTrue(user.check_password('StrongPass123!'))
        self.assertEqual(user.role, User.Role.OWNER)
        self.assertEqual(user.tenant, self.tenant)

        self.invitation.refresh_from_db()
        self.assertEqual(self.invitation.status, OwnerInvitation.Status.ACCEPTED)
