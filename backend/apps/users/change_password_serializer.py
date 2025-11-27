from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for password change endpoint.
    """
    current_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True)
    confirm_password = serializers.CharField(required=True, write_only=True)
    
    def validate_current_password(self, value):
        """
        Check that the current password is correct.
        """
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect")
        return value
    
    def validate_new_password(self, value):
        """
        Validate the new password using Django's password validators.
        """
        user = self.context['request'].user
        try:
            validate_password(value, user=user)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value
    
    def validate(self, data):
        """
        Check that new password and confirm password match.
        """
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({
                "confirm_password": "Password confirmation does not match"
            })
        
        # Check that new password is different from current password
        if data['current_password'] == data['new_password']:
            raise serializers.ValidationError({
                "new_password": "New password must be different from current password"
            })
        
        return data
    
    def save(self, **kwargs):
        """
        Update the user's password.
        """
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user
