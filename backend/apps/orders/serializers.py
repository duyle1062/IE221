from rest_framework import serializers
from .models import Order, OrderItem, Address
from apps.product.serializers import ProductSerializer


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
        read_only_fields = ["id", "created_at"]


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "product_name",
            "unit_price",
            "quantity",
            "line_total",
            "created_at",
        ]
        read_only_fields = ["id", "unit_price", "line_total", "created_at"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    address = AddressSerializer(read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "user_email",
            "restaurant_id",
            "address",
            "type",
            "subtotal",
            "delivery_fee",
            "discount",
            "total",
            "status",
            "payment_method",
            "payment_status",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "user_email",
            "subtotal",
            "total",
            "created_at",
            "updated_at",
        ]


class PlaceOrderSerializer(serializers.Serializer):
    address_id = serializers.IntegerField(required=True)
    payment_method = serializers.ChoiceField(
        choices=["CARD", "CASH", "WALLET", "THIRD_PARTY"], required=True
    )
    type = serializers.ChoiceField(
        choices=["DELIVERY", "PICKUP"], default="DELIVERY", required=False
    )
    delivery_fee = serializers.DecimalField(
        max_digits=10, decimal_places=2, default=0, required=False
    )
    discount = serializers.DecimalField(
        max_digits=10, decimal_places=2, default=0, required=False
    )
