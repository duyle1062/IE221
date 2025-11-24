from djoser.serializers import UserCreatePasswordRetypeSerializer as DjoserUserCreateSerializer
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class UserCreateSerializer(DjoserUserCreateSerializer):
    class Meta(DjoserUserCreateSerializer.Meta):
        model = User
        fields = ("id", "email", "firstname", "lastname", "password", "gender", "phone")

class UserSerializer(serializers.ModelSerializer):
    """Serializer for retrieving user information (includes role)"""
    class Meta:
        model = User
        fields = ("id", "email", "firstname", "lastname", "gender", "phone", "role", "is_active", "created_at", "updated_at")
        read_only_fields = ("id", "email", "role", "is_active", "created_at", "updated_at")

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['role'] = user.role
        return token