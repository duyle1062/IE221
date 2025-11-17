from rest_framework import serializers
from .models import Product, Category, ProductImage, Ratings
from apps.users.models import UserAccount as User

class ProductImageSerializer(serializers.ModelSerializer):
    """Serializer for ProductImage model - URL based"""
    
    class Meta:
        model = ProductImage
        fields = ['id', 'image_url', 'is_primary', 'sort_order', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def validate_image_url(self, value):
        """Validate that image_url is not empty"""
        if not value or not value.strip():
            raise serializers.ValidationError("Image URL cannot be empty")
        return value

        
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

class AdminProductListSerializer(serializers.ModelSerializer):
    """Admin serializer showing all products with category details"""
    category = CategorySerializer(read_only=True)
    average_rating = serializers.SerializerMethodField()
    total_ratings = serializers.SerializerMethodField()
    is_deleted = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'price',
            'category', 'restaurant', 'is_active', 'available',
            'average_rating', 'total_ratings', 'is_deleted',
            'created_at', 'updated_at', 'deleted_at'
        ]

    def get_average_rating(self, obj):
        if hasattr(obj, 'average_rating'):
            return round(obj.average_rating, 2) if obj.average_rating else None
        return obj.get_average_rating()

    def get_total_ratings(self, obj):
        if hasattr(obj, 'total_ratings'):
            return obj.total_ratings
        return Ratings.objects.filter(product=obj).count()

    def get_is_deleted(self, obj):
        return obj.deleted_at is not None
