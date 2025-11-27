from rest_framework import serializers
from apps.orders.models import Address


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = [
            "id",
            "street",
            "ward",
            "province",
            "phone",
            "is_default",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "is_active"]
    
    def validate(self, data):
        """
        Validate address data
        """
        if not data.get('street'):
            raise serializers.ValidationError({"street": "Street address is required"})
        if not data.get('ward'):
            raise serializers.ValidationError({"ward": "Ward is required"})
        if not data.get('province'):
            raise serializers.ValidationError({"province": "Province is required"})
        if not data.get('phone'):
            raise serializers.ValidationError({"phone": "Phone number is required"})
        
        return data
    
    def create(self, validated_data):
        """
        Handle is_default logic when creating address
        """
        user = validated_data.get('user')
        is_default = validated_data.get('is_default', False)
        
        # If this is set as default, unset all other default addresses for this user
        if is_default:
            Address.objects.filter(user=user, is_active=True).update(is_default=False)
        
        # If user has no addresses, make this one default
        if not Address.objects.filter(user=user, is_active=True).exists():
            validated_data['is_default'] = True
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """
        Handle is_default logic when updating address
        """
        is_default = validated_data.get('is_default')
        
        # If setting this as default, unset all other default addresses
        if is_default:
            Address.objects.filter(
                user=instance.user, 
                is_active=True
            ).exclude(id=instance.id).update(is_default=False)
        
        return super().update(instance, validated_data)
