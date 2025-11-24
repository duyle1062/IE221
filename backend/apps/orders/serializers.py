from rest_framework import serializers
from .models import (
    Order,
    OrderItem,
    Address,
    GroupOrder,
    GroupOrderMember,
    GroupOrderItem,
)
from apps.product.serializers import ProductSerializer


class UserBasicSerializer(serializers.Serializer):
    """Serializer for basic user information in orders"""

    id = serializers.IntegerField()
    email = serializers.EmailField()
    full_name = serializers.CharField()


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
    user = serializers.SerializerMethodField()
    user_email = serializers.CharField(source="user.email", read_only=True)
    is_group_order = serializers.SerializerMethodField()

    def get_user(self, obj):
        """Return user data if user exists"""
        if obj.user:
            return {
                "id": obj.user.id,
                "email": obj.user.email,
                "full_name": obj.user.get_full_name(),
            }
        return None

    class Meta:
        model = Order
        fields = [
            "id",
            "user",
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
            "group_order_id",
            "is_group_order",
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

    def get_is_group_order(self, obj):
        return obj.group_order_id is not None


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


# ============== Group Order Serializers ==============


class GroupOrderMemberSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True)
    user_name = serializers.SerializerMethodField()
    is_creator = serializers.SerializerMethodField()

    class Meta:
        model = GroupOrderMember
        fields = ["id", "user_email", "user_name", "is_creator", "joined_at"]
        read_only_fields = ["id", "joined_at"]

    def get_user_name(self, obj):
        return f"{obj.user.firstname} {obj.user.lastname}"

    def get_is_creator(self, obj):
        return obj.group_order.creator_id == obj.user.id


class GroupOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = GroupOrderItem
        fields = [
            "id",
            "user_id",
            "user_email",
            "user_name",
            "product_id",
            "product_name",
            "unit_price",
            "quantity",
            "line_total",
            "is_active",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "product_name",
            "unit_price",
            "line_total",
            "created_at",
        ]

    def get_user_name(self, obj):
        return f"{obj.user.firstname} {obj.user.lastname}"


class GroupOrderSerializer(serializers.ModelSerializer):
    creator_id = serializers.IntegerField(source="creator.id", read_only=True)
    creator_email = serializers.CharField(source="creator.email", read_only=True)
    members = GroupOrderMemberSerializer(many=True, read_only=True)
    items = GroupOrderItemSerializer(many=True, read_only=True)
    total_items = serializers.SerializerMethodField()

    class Meta:
        model = GroupOrder
        fields = [
            "id",
            "creator_id",
            "creator_email",
            "restaurant_id",
            "code",
            "status",
            "members",
            "items",
            "total_items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "code", "created_at", "updated_at"]

    def get_total_items(self, obj):
        return obj.items.filter(is_active=True).count()


class JoinGroupOrderSerializer(serializers.Serializer):
    code = serializers.CharField(required=True, max_length=50)


class AddGroupOrderItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(required=True)
    quantity = serializers.IntegerField(required=True, min_value=1)


class UpdateGroupOrderItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(required=True, min_value=1)


class PlaceGroupOrderSerializer(serializers.Serializer):
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
