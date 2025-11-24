from rest_framework import serializers
from .models import Product, Category, ProductImage, Ratings, Interact, Recommendation
from apps.users.models import UserAccount as User
from .utils import s3_handler


class ProductImageSerializer(serializers.ModelSerializer):
    """Serializer for ProductImage model - generates full URL from S3 key"""

    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["id", "image_url", "is_primary", "sort_order", "created_at"]
        read_only_fields = ["id", "image_url", "created_at"]

    def get_image_url(self, obj):
        """Generate full CloudFront/S3 URL from stored S3 key"""
        # obj.image_url contains S3 key, generate full URL
        if not obj.image_url:
            return None

        return s3_handler.generate_public_url(obj.image_url)


class CategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = Category
        fields = ["id", "name", "slug_name", "description", "is_active", "sort_order"]


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category", write_only=True
    )
    average_rating = serializers.SerializerMethodField()
    images = ProductImageSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "category_id",
            "name",
            "slug",
            "description",
            "price",
            "average_rating",
            "images",
            "category",
            "restaurant",
            "is_active",
            "available",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at", "deleted_at"]

    def get_average_rating(self, obj):
        if hasattr(obj, "average_rating"):
            return round(obj.average_rating, 2) if obj.average_rating else None
        return obj.get_average_rating()
    
    def validate_name(self, value):
        """
        Validate that product name is unique (including soft-deleted products)
        """
        # Check if updating existing product
        if self.instance:
            # Exclude current instance from check
            if Product.objects.filter(name=value).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError(
                    "A product with this name already exists."
                )
        else:
            # Creating new product - check all products including soft-deleted
            if Product.objects.filter(name=value).exists():
                raise serializers.ValidationError(
                    "A product with this name already exists."
                )
        return value
    
    def validate_slug(self, value):
        """
        Validate that product slug is unique (including soft-deleted products)
        """
        # Check if updating existing product
        if self.instance:
            # Exclude current instance from check
            if Product.objects.filter(slug=value).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError(
                    "A product with this slug already exists."
                )
        else:
            # Creating new product - check all products including soft-deleted
            if Product.objects.filter(slug=value).exists():
                raise serializers.ValidationError(
                    "A product with this slug already exists."
                )
        return value


class RatingUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email"]


class RatingSerializer(serializers.ModelSerializer):
    user = RatingUserSerializer(read_only=True)

    class Meta:
        model = Ratings
        fields = ["id", "user", "rating", "comment", "created_at"]
        read_only_fields = ["user", "created_at"]

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be from 1 to 5 stars")
        return value


class AdminProductListSerializer(serializers.ModelSerializer):
    """Admin serializer showing all products with category details"""

    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category", write_only=True, required=False
    )
    # Accept both 'category' and 'category_id' for backwards compatibility
    # This allows frontend to send either field name
    
    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "price",
            "category",
            "category_id",
            "restaurant",
            "is_active",
            "available",
            "average_rating",
            "total_ratings",
            "is_deleted",
            "created_at",
            "updated_at",
            "deleted_at",
        ]
        read_only_fields = ["created_at", "updated_at", "deleted_at"]
        extra_kwargs = {
            'category': {'write_only': False, 'required': False}
        }
    
    def to_internal_value(self, data):
        """
        Override to handle both 'category' and 'category_id' field names
        """
        # If 'category' is provided but 'category_id' is not, copy the value
        if 'category' in data and 'category_id' not in data:
            data = data.copy()
            data['category_id'] = data['category']
        
        return super().to_internal_value(data)
    
    average_rating = serializers.SerializerMethodField()
    total_ratings = serializers.SerializerMethodField()
    is_deleted = serializers.SerializerMethodField()

    def get_average_rating(self, obj):
        if hasattr(obj, "average_rating"):
            return round(obj.average_rating, 2) if obj.average_rating else None
        return obj.get_average_rating()

    def get_total_ratings(self, obj):
        if hasattr(obj, "total_ratings"):
            return obj.total_ratings
        return Ratings.objects.filter(product=obj).count()

    def get_is_deleted(self, obj):
        return obj.deleted_at is not None
    
    def validate_name(self, value):
        """
        Validate that product name is unique (including soft-deleted products)
        """
        # Check if updating existing product
        if self.instance:
            # Exclude current instance from check
            if Product.objects.filter(name=value).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError(
                    "A product with this name already exists."
                )
        else:
            # Creating new product - check all products including soft-deleted
            if Product.objects.filter(name=value).exists():
                raise serializers.ValidationError(
                    "A product with this name already exists."
                )
        return value
    
    def validate_slug(self, value):
        """
        Validate that product slug is unique (including soft-deleted products)
        """
        # Check if updating existing product
        if self.instance:
            # Exclude current instance from check
            if Product.objects.filter(slug=value).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError(
                    "A product with this slug already exists."
                )
        else:
            # Creating new product - check all products including soft-deleted
            if Product.objects.filter(slug=value).exists():
                raise serializers.ValidationError(
                    "A product with this slug already exists."
                )
        return value


# ============== S3 Upload Serializers ==============


class BulkPresignedURLRequestSerializer(serializers.Serializer):
    """Request serializer for getting multiple presigned URLs"""

    files = serializers.ListField(
        child=serializers.DictField(),
        min_length=1,
        max_length=10,  # Limit to 10 images per request
    )

    def validate_files(self, value):
        """Validate each file in the array"""
        allowed_types = ["image/jpeg", "image/png", "image/webp"]

        for idx, file_data in enumerate(value):
            # Check required fields
            if "filename" not in file_data:
                raise serializers.ValidationError(
                    f"File at index {idx} missing 'filename'"
                )
            if "content_type" not in file_data:
                raise serializers.ValidationError(
                    f"File at index {idx} missing 'content_type'"
                )

            # Validate content type
            if file_data["content_type"] not in allowed_types:
                raise serializers.ValidationError(
                    f"File at index {idx} has invalid content_type. Allowed: {', '.join(allowed_types)}"
                )

        return value


class BulkConfirmUploadSerializer(serializers.Serializer):
    """Serializer to confirm multiple uploads"""

    uploads = serializers.ListField(
        child=serializers.DictField(), min_length=1, max_length=10
    )

    def validate_uploads(self, value):
        """Validate each upload in the array"""
        for idx, upload_data in enumerate(value):
            # Check required field
            if "s3_key" not in upload_data:
                raise serializers.ValidationError(
                    f"Upload at index {idx} missing 's3_key'"
                )

            # Validate s3_key format
            if not upload_data["s3_key"].startswith("product/"):
                raise serializers.ValidationError(
                    f"Upload at index {idx} has invalid S3 key format"
                )

        return value


class InteractSerializer(serializers.ModelSerializer):
    """Serializer for tracking product interactions"""

    product_name = serializers.CharField(source="product.name", read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = Interact
        fields = ["id", "user", "user_email", "product", "product_name", "created_at"]
        read_only_fields = ["id", "user", "created_at"]


class RecommendationSerializer(serializers.ModelSerializer):
    """Serializer for user recommendations"""

    products = serializers.SerializerMethodField()
    user_email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = Recommendation
        fields = ["id", "user", "user_email", "product_ids", "products", "updated_at"]
        read_only_fields = ["id", "updated_at"]

    def get_products(self, obj):
        """Get full product details for recommended products - OPTIMIZED"""
        if not obj.product_ids:
            return []

        # ✅ FIX: Prefetch all related data in 3 queries instead of N+1
        from django.db.models import Avg

        products = (
            Product.objects.filter(
                id__in=obj.product_ids, is_active=True, available=True
            )
            .select_related("category")  # Join category table (1 query)
            .prefetch_related("images")  # Prefetch images (1 query)
            .annotate(average_rating=Avg("ratings__rating"))  # Calculate in DB
        )

        # Maintain order from product_ids (important for ranking)
        product_dict = {p.id: p for p in products}
        ordered_products = [
            product_dict[pid] for pid in obj.product_ids if pid in product_dict
        ]

        return ProductSerializer(ordered_products, many=True).data
