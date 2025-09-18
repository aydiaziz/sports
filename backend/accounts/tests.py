import json

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse


User = get_user_model()


class LoginViewTests(TestCase):
    def setUp(self):
        self.password = 'StrongPass123!'
        self.user = User.objects.create_user(
            email='Owner@Example.com',
            password=self.password,
            role=User.Role.SUPERADMIN,
        )
        self.client.defaults['HTTP_HOST'] = 'localhost'
        self.url = reverse('accounts:login')

    def _post_login(self, email: str, password: str | None = None):
        payload = json.dumps({'email': email, 'password': password or self.password})
        return self.client.post(self.url, data=payload, content_type='application/json')

    def test_login_accepts_case_insensitive_email(self):
        response = self._post_login('OWNER@example.COM')

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertIn('access', body)
        self.assertIn('refresh', body)

    def test_login_strips_whitespace_from_email(self):
        response = self._post_login('  owner@example.com  ')

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertIn('access', body)
        self.assertIn('refresh', body)
