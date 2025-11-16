from rest_framework import serializers
from .models import Product, Category, ProductImage, Ratings
import base64
from apps.users.models import UserAccount as User

class ProductImageSerializer(serializers.ModelSerializer):
    """Serializer for ProductImage model - File upload only"""
    image_file = serializers.ImageField(write_only=True, required=True)
    image = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = ProductImage
        fields = ['id', 'image_file', 'image', 'image_content_type', 'is_primary', 'sort_order', 'created_at']
        read_only_fields = ['id', 'created_at', 'image_content_type']
    
    def get_image(self, obj):
        """Convert binary image data to base64 for response"""
        if obj.image_data:
            encoded = base64.b64encode(obj.image_data).decode('utf-8')
            return f"data:{obj.image_content_type};base64,{encoded}"
        return None
    
    def create(self, validated_data):
        """Handle file upload during creation"""
        image_file = validated_data.pop('image_file')
        
        try:
            validated_data['image_data'] = image_file.read()
            validated_data['image_content_type'] = image_file.content_type or 'image/jpeg'
        except Exception as e:
            raise serializers.ValidationError(f"Invalid image file: {str(e)}")
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Handle file upload during update"""
        image_file = validated_data.pop('image_file', None)
        
        if image_file:
            try:
                validated_data['image_data'] = image_file.read()
                validated_data['image_content_type'] = image_file.content_type or 'image/jpeg'
            except Exception as e:
                raise serializers.ValidationError(f"Invalid image file: {str(e)}")
        
        return super().update(instance, validated_data)

        
class CategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = Category
        fields = ["id", "name", "slug_name", "description", "is_active", "sort_order"]
        
class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), source='category', write_only=True)
    average_rating = serializers.SerializerMethodField()
    images = ProductImageSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = ["id", "category_id", "name", "slug", "description", "price", "average_rating", 
                  "images", "category", "restaurant", "is_active", "available",
                  "created_at", "updated_at"]
        read_only_fields = ['created_at', 'updated_at', 'deleted_at']

    def get_average_rating(self, obj):
        if hasattr(obj, 'average_rating'):
            return round(obj.average_rating, 2) if obj.average_rating else None
        return obj.get_average_rating() 
    
class RatingUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email'] 

class RatingSerializer(serializers.ModelSerializer):
    user = RatingUserSerializer(read_only=True) 

    class Meta:
        model = Ratings
        fields = ['id', 'user', 'rating', 'comment', 'created_at']
        read_only_fields = ['user', 'created_at']
    
    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be from 1 to 5 stars")
        return value
