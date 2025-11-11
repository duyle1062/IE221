from rest_framework import serializers
from .models import Product, Category
        
class CategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = Category
        fields = ["id", "name", "slug_name", "description", "is_active", "sort_order"]
        
class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), source='category', write_only=True)
    average_rating = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ["id", "category_id", "name", "slug", "description", "price", "average_rating", "category", "restaurant", "is_active", "available", "deleted_at"]
        read_only_fields = ["deleted_at"]

    def get_average_rating(self, obj):
        # If annotated in queryset
        if hasattr(obj, 'average_rating'):
            return round(obj.average_rating, 2) if obj.average_rating else None
        # Otherwise call the model method (fallback)
        return obj.get_average_rating() 