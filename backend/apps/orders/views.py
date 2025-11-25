from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status, viewsets, mixins
from rest_framework.generics import ListAPIView
from django.db import transaction
from decimal import Decimal
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from apps.users.permissions import IsOwner, IsAdminUser, IsRegularUser
from IE221.logger import get_logger

logger = get_logger(__name__)

from .models import Order, OrderItem, Address, OrderStatus
from apps.carts.models import Cart, CartItem
from .serializers import OrderSerializer, PlaceOrderSerializer
from apps.product.pagination import StandardResultsSetPagination
from apps.addresses.serializers import AddressSerializer


class PlaceOrderView(APIView):
    """
    POST: IsAuthenticated + IsRegularUser - Convert cart to order (USER only, NOT admin)
    Body: {
        "address_id": 1,
        "payment_method": "CASH",
        "type": "DELIVERY",  // optional, default: DELIVERY
        "delivery_fee": 20000,  // optional, default: 0
        "discount": 0  // optional, default: 0
    }
    """

    permission_classes = [IsAuthenticated, IsRegularUser]

    def post(self, request):
        serializer = PlaceOrderSerializer(data=request.data)

        if not serializer.is_valid():
            logger.warning("Order placement failed - invalid data", extra={
                "user_id": request.user.id,
                "errors": serializer.errors
            })
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        address_id = serializer.validated_data["address_id"]
        payment_method = serializer.validated_data["payment_method"]
        order_type = serializer.validated_data.get("type", "DELIVERY")
        delivery_fee = serializer.validated_data.get("delivery_fee", Decimal("0"))
        discount = serializer.validated_data.get("discount", Decimal("0"))

        # Validate address belongs to user
        try:
            address = Address.objects.get(id=address_id, user=user, is_active=True)
        except Address.DoesNotExist:
            return Response(
                {"error": "Address not found or not active"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Get user's cart
        try:
            cart = Cart.objects.prefetch_related("items__product").get(user=user)
        except Cart.DoesNotExist:
            return Response(
                {"error": "Cart not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Check if cart is empty
        cart_items = cart.items.all()
        if not cart_items.exists():
            return Response(
                {"error": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Calculate subtotal
        subtotal = Decimal("0")
        for item in cart_items:
            if not item.product.is_active or not item.product.available:
                return Response(
                    {"error": f"Product '{item.product.name}' is not available"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            subtotal += item.product.price * item.quantity

        # Calculate total
        total = subtotal + delivery_fee - discount

        # Create order with transaction
        try:
            with transaction.atomic():
                # Create order with PENDING status
                order = Order.objects.create(
                    user=user,
                    restaurant_id=1,  # Always 1 as per requirement
                    address=address,
                    type=order_type,
                    subtotal=subtotal,
                    delivery_fee=delivery_fee,
                    discount=discount,
                    total=total,
                    payment_method=payment_method,
                    status="PENDING",
                    payment_status="PENDING",
                )

                # Create order items from cart items
                order_items = []
                for cart_item in cart_items:
                    line_total = cart_item.product.price * cart_item.quantity
                    order_item = OrderItem(
                        order=order,
                        product=cart_item.product,
                        unit_price=cart_item.product.price,
                        quantity=cart_item.quantity,
                        line_total=line_total,
                    )
                    order_items.append(order_item)

                OrderItem.objects.bulk_create(order_items)

                # Clear cart after successful order
                cart_items.delete()

                # Create payment record
                from apps.payment.models import Payment
                from apps.payment.vnpay_service import VNPayService

                payment = Payment.objects.create(
                    order=order,
                    amount=order.total,
                    method=payment_method,
                    status="PENDING",
                )

                # Handle CASH, WALLET, THIRD_PARTY - auto succeed
                # WALLET and THIRD_PARTY auto-succeed because VNPAYQR/INTCARD are not enabled
                if payment_method in ["CASH", "WALLET", "THIRD_PARTY"]:
                    payment.status = "SUCCEEDED"
                    payment.save()

                    order.status = "PAID"
                    order.payment_status = "SUCCEEDED"
                    order.save()

                    logger.info("Order placed successfully", extra={
                        "user_id": user.id,
                        "order_id": order.id,
                        "payment_method": payment_method,
                        "total": float(total),
                        "items_count": len(order_items)
                    })
                    order_serializer = OrderSerializer(order)
                    return Response(
                        {
                            "message": "Order placed successfully",
                            "order": order_serializer.data,
                        },
                        status=status.HTTP_201_CREATED,
                    )

                # Handle CARD payment via VNPAY gateway
                elif payment_method == "CARD":
                    vnpay_service = VNPayService()
                    amount = int(order.total)

                    # Get client IP
                    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
                    if x_forwarded_for:
                        ip_address = x_forwarded_for.split(",")[0]
                    else:
                        ip_address = request.META.get("REMOTE_ADDR", "127.0.0.1")

                    result = vnpay_service.create_payment(
                        order_id=order.id,
                        amount=amount,
                        order_info=f"Thanh toan don hang #{order.id}",
                        ip_address=ip_address,
                        payment_method=payment_method,
                    )

                    if result["success"]:
                        # Store transaction reference
                        payment.gateway_transaction_id = result["txn_ref"]
                        payment.save()

                        logger.info("Order created - pending VNPAY payment", extra={
                            "user_id": user.id,
                            "order_id": order.id,
                            "payment_method": payment_method,
                            "total": float(total),
                            "txn_ref": result["txn_ref"]
                        })
                        order_serializer = OrderSerializer(order)
                        return Response(
                            {
                                "message": "Order created, please complete payment",
                                "order": order_serializer.data,
                                "payment": {
                                    "id": payment.id,
                                    "status": payment.status,
                                    "payment_url": result["payment_url"],
                                },
                            },
                            status=status.HTTP_201_CREATED,
                        )
                    else:
                        # If VNPAY fails, rollback will happen automatically
                        raise Exception(
                            f"Payment gateway error: {result.get('message')}"
                        )

        except Exception as e:
            logger.error("Order creation failed", extra={
                "user_id": request.user.id,
                "error": str(e)
            })
            return Response(
                {"error": f"Failed to create order: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class OrderListView(ListAPIView):
    """
    GET /api/orders/
    Get all orders for the authenticated user (USER only, NOT admin)
    """

    permission_classes = [IsAuthenticated, IsRegularUser]
    serializer_class = OrderSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related(
            "items__product", "address"
        )


class OrderDetailView(APIView):
    """
    GET /api/orders/<order_id>/
    Get details of a specific order

    GET: IsAuthenticated + IsRegularUser + IsOwner - Get details (USER only)
    DELETE: IsAuthenticated + IsRegularUser + IsOwner - Cancel order (USER only)
    """

    permission_classes = [IsAuthenticated, IsRegularUser, IsOwner]

    def get(self, request, order_id):
        try:
            order = Order.objects.prefetch_related("items__product", "address").get(
                id=order_id, user=request.user
            )
            serializer = OrderSerializer(order)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND
            )


class CancelOrderView(APIView):
    """
    POST /api/orders/<order_id>/cancel/
    Cancel an order - only allowed if status is PAID (USER only, NOT admin)
    """

    permission_classes = [IsAuthenticated, IsRegularUser]

    def post(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Check if order can be cancelled
        if order.status != "PAID":
            return Response(
                {
                    "error": f"Cannot cancel order. Order status is '{order.status}'. Only orders with status 'PAID' can be cancelled."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Cancel the order
        order.status = "CANCELLED"
        order.payment_status = "REFUNDED"
        order.save()

        logger.info("Order cancelled by user", extra={
            "user_id": request.user.id,
            "order_id": order.id,
            "previous_status": "PAID"
        })
        serializer = OrderSerializer(order)
        return Response(
            {"message": "Order cancelled successfully", "order": serializer.data},
            status=status.HTTP_200_OK,
        )


# ============== Admin Order Views ==============


class AdminOrderListView(ListAPIView):
    """
    GET /api/admin/orders/

    Query Parameters:
    - status: Filter by order status (PAID, CONFIRMED, PREPARING, READY, DELIVERED, CANCELLED)
    - payment_status: Filter by payment status (PENDING, SUCCEEDED, FAILED, REFUNDED)
    - payment_method: Filter by payment method (CARD, CASH, WALLET, THIRD_PARTY)
    - ordering: Sort by field (id, created_at, total, status) - prefix with '-' for descending
    - page: Page number
    - page_size: Items per page (max 100)
    """

    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["status", "payment_status", "payment_method", "type"]
    ordering_fields = ["id", "created_at", "updated_at", "total", "status"]
    ordering = ["id"]  # Default ordering by ID
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        """
        Get all orders with related data optimized
        """
        queryset = Order.objects.select_related("user", "address").prefetch_related(
            "items__product"
        )
        return queryset


class AdminChangeStatusView(APIView):
    """
    PATCH /api/admin/orders/<order_id>/update-status/

    Body:
    {
        "status": "PAID" | "CONFIRMED" | "PREPARING" | "READY" | "DELIVERED" | "CANCELLED"
    }

    Valid state transitions:
    - PENDING → PAID, CANCELLED
    - PAID → CONFIRMED, CANCELLED
    - CONFIRMED → PREPARING, CANCELLED
    - PREPARING → READY, CANCELLED
    - READY → DELIVERED, CANCELLED
    - DELIVERED → (terminal state, no transitions)
    - CANCELLED → (terminal state, no transitions)
    """

    permission_classes = [IsAuthenticated, IsAdminUser]

    # Define valid state transitions
    VALID_TRANSITIONS = {
        OrderStatus.PENDING: [OrderStatus.PAID, OrderStatus.CANCELLED],
        OrderStatus.PAID: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
        OrderStatus.CONFIRMED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
        OrderStatus.PREPARING: [OrderStatus.READY, OrderStatus.CANCELLED],
        OrderStatus.READY: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
        OrderStatus.DELIVERED: [],  # Terminal state
        OrderStatus.CANCELLED: [],  # Terminal state
    }

    def patch(self, request, order_id):
        # Get the order
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Get new status from request
        new_status = request.data.get("status")

        if not new_status:
            return Response(
                {"error": "Status field is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate new status is a valid OrderStatus
        valid_statuses = [choice.value for choice in OrderStatus]
        if new_status not in valid_statuses:
            return Response(
                {
                    "error": f"Invalid status. Valid options: {', '.join(valid_statuses)}"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get current status
        old_status = order.status

        # Check if trying to change to the same status
        if old_status == new_status:
            return Response(
                {"error": f"Order is already in '{new_status}' status"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate state transition
        # Convert string status to OrderStatus enum for lookup
        try:
            current_status_enum = OrderStatus(old_status)
            new_status_enum = OrderStatus(new_status)
        except ValueError:
            return Response(
                {"error": "Invalid status value"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        allowed_transitions = self.VALID_TRANSITIONS.get(current_status_enum, [])
        if new_status_enum not in allowed_transitions:
            # Build helpful error message
            if not allowed_transitions:
                error_msg = f"Cannot change status from '{old_status}'. This is a terminal state."
            else:
                allowed_str = ", ".join([s.value for s in allowed_transitions])
                error_msg = f"Invalid status transition from '{old_status}' to '{new_status}'. Allowed transitions: {allowed_str}"

            return Response(
                {"error": error_msg},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update order status
        order.status = new_status

        # If cancelled, update payment status to REFUNDED
        if new_status == OrderStatus.CANCELLED:
            order.payment_status = "REFUNDED"

        order.save()

        logger.info("Order status updated by admin", extra={
            "admin_id": request.user.id,
            "order_id": order.id,
            "old_status": old_status,
            "new_status": new_status
        })
        # Return updated order
        serializer = OrderSerializer(order)
        return Response(
            {
                "message": f"Order status updated from '{old_status}' to '{new_status}'",
                "order": serializer.data,
            },
            status=status.HTTP_200_OK,
        )
