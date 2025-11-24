from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db.models import Sum, Count, Q, F
from django.db.models.functions import TruncDate, TruncMonth
from datetime import datetime, timedelta
from decimal import Decimal

from apps.users.permissions import IsAdminUser
from apps.payment.models import Payment
from apps.orders.models import Order, OrderItem, PaymentStatus, PaymentMethod
from .reports_serializers import (
    RevenueReportSerializer,
    TopProductSerializer,
    OrderRatioSerializer,
)


class RevenueReportView(APIView):
    """
    Admin endpoint for revenue reports
    GET /api/reports/revenue/?period=day&start_date=2025-01-01&end_date=2025-01-31&payment_method=CARD

    Query params:
    - period: 'day' or 'month' (default: 'day')
    - start_date: YYYY-MM-DD (optional)
    - end_date: YYYY-MM-DD (optional)
    - payment_method: CASH, CARD, WALLET, THIRD_PARTY (optional)
    """

    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        # Get query parameters
        period = request.query_params.get("period", "day")
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        payment_method = request.query_params.get("payment_method")

        # Validate period
        if period not in ["day", "month"]:
            return Response(
                {"error": "Period must be 'day' or 'month'"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Base queryset - only SUCCEEDED payments
        payments = Payment.objects.filter(status=PaymentStatus.SUCCEEDED)

        # Apply date filters
        if start_date:
            try:
                start_date_obj = datetime.strptime(start_date, "%Y-%m-%d").date()
                payments = payments.filter(created_at__date__gte=start_date_obj)
            except ValueError:
                return Response(
                    {"error": "Invalid start_date format. Use YYYY-MM-DD"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if end_date:
            try:
                end_date_obj = datetime.strptime(end_date, "%Y-%m-%d").date()
                payments = payments.filter(created_at__date__lte=end_date_obj)
            except ValueError:
                return Response(
                    {"error": "Invalid end_date format. Use YYYY-MM-DD"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Apply payment method filter
        if payment_method:
            if payment_method not in [choice[0] for choice in PaymentMethod.choices]:
                return Response(
                    {
                        "error": f"Invalid payment_method. Choose from: {', '.join([c[0] for c in PaymentMethod.choices])}"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            payments = payments.filter(method=payment_method)

        # Aggregate by period
        if period == "day":
            revenue_data = (
                payments.annotate(date=TruncDate("created_at"))
                .values("date")
                .annotate(
                    revenue=Sum("amount"),
                    order_count=Count("order_id", distinct=True),
                )
                .order_by("date")
            )
        else:  # month
            revenue_data = (
                payments.annotate(date=TruncMonth("created_at"))
                .values("date")
                .annotate(
                    revenue=Sum("amount"),
                    order_count=Count("order_id", distinct=True),
                )
                .order_by("date")
            )
            # Convert datetime to date for monthly data
            revenue_data = [
                {**item, "date": item["date"].date() if item["date"] else None}
                for item in revenue_data
            ]

        # Add payment_method to response if filtered
        if payment_method:
            revenue_data = [
                {**item, "payment_method": payment_method} for item in revenue_data
            ]

        serializer = RevenueReportSerializer(revenue_data, many=True)

        return Response(
            {
                "period": period,
                "start_date": start_date,
                "end_date": end_date,
                "payment_method": payment_method,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class TopProductsReportView(APIView):
    """
    Admin endpoint for top selling products
    GET /api/reports/top-products/?sort_by=quantity&start_date=2025-01-01&end_date=2025-01-31&limit=5

    Query params:
    - sort_by: 'quantity' or 'revenue' (default: 'quantity')
    - start_date: YYYY-MM-DD (optional)
    - end_date: YYYY-MM-DD (optional)
    - limit: number of top products to return (default: 5, max: 20)
    """

    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        # Get query parameters
        sort_by = request.query_params.get("sort_by", "quantity")
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        limit = int(request.query_params.get("limit", 5))

        # Validate sort_by
        if sort_by not in ["quantity", "revenue"]:
            return Response(
                {"error": "sort_by must be 'quantity' or 'revenue'"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate limit
        if limit < 1 or limit > 20:
            return Response(
                {"error": "limit must be between 1 and 20"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Base queryset - only order items from orders with SUCCEEDED payments
        succeeded_payments = Payment.objects.filter(
            status=PaymentStatus.SUCCEEDED
        ).values_list("order_id", flat=True)

        order_items = OrderItem.objects.filter(order_id__in=succeeded_payments)

        # Apply date filters
        if start_date:
            try:
                start_date_obj = datetime.strptime(start_date, "%Y-%m-%d").date()
                order_items = order_items.filter(
                    order__created_at__date__gte=start_date_obj
                )
            except ValueError:
                return Response(
                    {"error": "Invalid start_date format. Use YYYY-MM-DD"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if end_date:
            try:
                end_date_obj = datetime.strptime(end_date, "%Y-%m-%d").date()
                order_items = order_items.filter(
                    order__created_at__date__lte=end_date_obj
                )
            except ValueError:
                return Response(
                    {"error": "Invalid end_date format. Use YYYY-MM-DD"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Aggregate product data
        product_stats = (
            order_items.values("product_id", "product__name")
            .annotate(
                quantity_sold=Sum("quantity"),
                revenue=Sum(F("quantity") * F("unit_price")),
            )
            .order_by(
                f"-{sort_by if sort_by == 'quantity' else 'revenue'}_sold"
                if sort_by == "quantity"
                else "-revenue"
            )
        )

        # Get top products
        top_products = list(product_stats[:limit])

        # Format response
        formatted_data = [
            {
                "product_id": item["product_id"],
                "product_name": item["product__name"],
                "quantity_sold": item["quantity_sold"],
                "revenue": item["revenue"],
            }
            for item in top_products
        ]

        serializer = TopProductSerializer(formatted_data, many=True)

        return Response(
            {
                "sort_by": sort_by,
                "start_date": start_date,
                "end_date": end_date,
                "limit": limit,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class OrderRatioReportView(APIView):
    """
    Admin endpoint for individual vs group order ratio
    GET /api/reports/order-ratio/

    Returns all-time statistics comparing individual orders vs group orders
    """

    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        # Get all orders with SUCCEEDED payments
        succeeded_payments = Payment.objects.filter(
            status=PaymentStatus.SUCCEEDED
        ).values_list("order_id", flat=True)

        all_orders = Order.objects.filter(id__in=succeeded_payments)

        # Individual orders (group_order_id is NULL)
        individual_orders = all_orders.filter(group_order_id__isnull=True)
        individual_count = individual_orders.count()
        individual_revenue = individual_orders.aggregate(total=Sum("total"))[
            "total"
        ] or Decimal("0.00")

        # Group orders (group_order_id is NOT NULL)
        group_orders = all_orders.filter(group_order_id__isnull=False)
        group_count = group_orders.count()
        group_revenue = group_orders.aggregate(total=Sum("total"))["total"] or Decimal(
            "0.00"
        )

        # Totals
        total_count = individual_count + group_count
        total_revenue = individual_revenue + group_revenue

        # Calculate percentages
        individual_orders_percentage = (
            (individual_count / total_count * 100) if total_count > 0 else 0
        )
        group_orders_percentage = (
            (group_count / total_count * 100) if total_count > 0 else 0
        )
        individual_revenue_percentage = (
            (float(individual_revenue) / float(total_revenue) * 100)
            if total_revenue > 0
            else 0
        )
        group_revenue_percentage = (
            (float(group_revenue) / float(total_revenue) * 100)
            if total_revenue > 0
            else 0
        )

        data = {
            "individual_orders_count": individual_count,
            "individual_orders_revenue": individual_revenue,
            "group_orders_count": group_count,
            "group_orders_revenue": group_revenue,
            "total_orders_count": total_count,
            "total_revenue": total_revenue,
            "individual_orders_percentage": round(individual_orders_percentage, 2),
            "group_orders_percentage": round(group_orders_percentage, 2),
            "individual_revenue_percentage": round(individual_revenue_percentage, 2),
            "group_revenue_percentage": round(group_revenue_percentage, 2),
        }

        serializer = OrderRatioSerializer(data)

        return Response(serializer.data, status=status.HTTP_200_OK)
