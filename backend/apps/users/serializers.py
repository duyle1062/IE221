from rest_framework import serializers
from .models import UserAccount

class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField(source='get_full_name')
    
    class Meta:
        model = UserAccount
        fields = [
            'id',
            'firstname', 
            'lastname',
            'full_name',
            'email', 
            'gender',
            'role',
            'phone',
            'is_active',
            'created_at',
            'updated_at'
        ]

class UserUpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAccount
        fields = [
            'firstname',
            'lastname',
            'gender',
            'phone'
        ]