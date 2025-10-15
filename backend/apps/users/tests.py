from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from .models import UserAccount

class UserProfileAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = UserAccount.objects.create_user(
            email="test@example.com",
            firstname="Test",
            lastname="User",
            phone="1234567890",
            gender="MALE",
            password="password123"
        )
        self.client.force_authenticate(user=self.user)  # Authenticate user

    def test_get_user_profile(self):
        response = self.client.get('/api/users/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['success'], True)
        self.assertEqual(response.data['data']['email'], self.user.email)