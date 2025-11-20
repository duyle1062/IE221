from rest_framework import serializers


class RevenueReportSerializer(serializers.Serializer):
    """Serializer for revenue report data"""

    date = serializers.DateField(help_text="Date of the revenue")
    revenue = serializers.DecimalField(
        max_digits=12, decimal_places=2, help_text="Total revenue for the date"
    )
    order_count = serializers.IntegerField(help_text="Number of orders")
    payment_method = serializers.CharField(
        required=False, help_text="Payment method (if filtered)"
    )


class TopProductSerializer(serializers.Serializer):
    """Serializer for top selling products"""

    product_id = serializers.IntegerField()
    product_name = serializers.CharField()
    quantity_sold = serializers.IntegerField(help_text="Total quantity sold")
    revenue = serializers.DecimalField(
        max_digits=12, decimal_places=2, help_text="Total revenue from this product"
    )


class OrderRatioSerializer(serializers.Serializer):
    """Serializer for individual vs group order ratio"""

    individual_orders_count = serializers.IntegerField(
        help_text="Number of individual orders"
    )
    individual_orders_revenue = serializers.DecimalField(
        max_digits=12, decimal_places=2, help_text="Revenue from individual orders"
    )
    group_orders_count = serializers.IntegerField(help_text="Number of group orders")
    group_orders_revenue = serializers.DecimalField(
        max_digits=12, decimal_places=2, help_text="Revenue from group orders"
    )
    total_orders_count = serializers.IntegerField(help_text="Total number of orders")
    total_revenue = serializers.DecimalField(
        max_digits=12, decimal_places=2, help_text="Total revenue"
    )
    individual_orders_percentage = serializers.FloatField(
        help_text="Percentage of individual orders"
    )
    group_orders_percentage = serializers.FloatField(
        help_text="Percentage of group orders"
    )
    individual_revenue_percentage = serializers.FloatField(
        help_text="Percentage of revenue from individual orders"
    )
    group_revenue_percentage = serializers.FloatField(
        help_text="Percentage of revenue from group orders"
    )
