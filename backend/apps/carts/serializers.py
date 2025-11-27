# apps/cart/serializers.py
from rest_framework import serializers
from django.conf import settings
from django.core.files.storage import default_storage
from .models import Cart, CartItem
from apps.product.models import Product
from apps.product.utils import s3_handler


# READ
class SimpleProductSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ["id", "name", "price", "image_url"]

    def get_image_url(self, obj):
        # Get the primary image or the first image
        primary_image = obj.images.filter(is_primary=True).first()
        if primary_image and primary_image.image_url:
            return s3_handler.generate_public_url(primary_image.image_url)

        # Fallback to the first image if no primary image
        first_image = (
            obj.images.filter(image_url__isnull=False)
            .exclude(image_url__exact="")
            .first()
        )
        if first_image:
            return s3_handler.generate_public_url(first_image.image_url)

        # Return placeholder URL if no valid image found
        # Using data URI SVG to avoid external service dependency
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f0f0f0' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='14' font-family='Arial'%3ENo Image%3C/text%3E%3C/svg%3E"


class CartItemSerializer(serializers.ModelSerializer):
    product = SimpleProductSerializer(read_only=True)
    total_item_price = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ["id", "product", "quantity", "total_item_price"]

    def get_total_item_price(self, obj):
        if obj.product:
            return obj.quantity * obj.product.price
        return 0


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_price = serializers.SerializerMethodField()
    total_items = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ["id", "items", "total_price", "total_items", "updated_at"]

    def get_total_price(self, obj):
        return sum(
            item.quantity * item.product.price
            for item in obj.items.all()
            if item.product
        )

    def get_total_items(self, obj):
        return sum(item.quantity for item in obj.items.all())


# WRITE


class AddCartItemSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField()

    class Meta:
        model = CartItem
        fields = ["product_id", "quantity"]

    def validate_product_id(self, value):
        if not Product.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Product does not exist.")
        return value

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be at least 1.")
        return value


class UpdateCartItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartItem
        fields = ["quantity"]

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be at least 1.")
        return value
