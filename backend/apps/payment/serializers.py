from rest_framework import serializers
from .models import Payment
from apps.orders.serializers import OrderSerializer


class PaymentSerializer(serializers.ModelSerializer):
    order = OrderSerializer(read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "order",
            "amount",
            "method",
            "status",
            "gateway_transaction_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class CreatePaymentSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()

    def validate_order_id(self, value):
        from apps.orders.models import Order

        try:
            order = Order.objects.get(id=value)
        except Order.DoesNotExist:
            raise serializers.ValidationError("Order not found")

        # Check if order is pending
        if order.status != "PENDING":
            raise serializers.ValidationError("Order is not pending")

        # Check if payment already exists
        if Payment.objects.filter(order=order).exists():
            raise serializers.ValidationError("Payment already exists for this order")

        return value
