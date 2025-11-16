from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db import transaction
from decimal import Decimal

from .models import Order, OrderItem, Address
from apps.carts.models import Cart, CartItem
from .serializers import OrderSerializer, PlaceOrderSerializer, AddressSerializer
from .permissions import IsAdminUser


class PlaceOrderView(APIView):
    """
    POST /api/orders/place/
    Convert cart to order
    Body: {
        "address_id": 1,
        "payment_method": "CASH",
        "type": "DELIVERY",  // optional, default: DELIVERY
        "delivery_fee": 20000,  // optional, default: 0
        "discount": 0  // optional, default: 0
    }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PlaceOrderSerializer(data=request.data)

        if not serializer.is_valid():
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
                # Create order
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
                    status="PAID",
                    payment_status="SUCCEEDED",
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

                # Return created order
                order_serializer = OrderSerializer(order)
                return Response(order_serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {"error": f"Failed to create order: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class OrderListView(APIView):
    """
    GET /api/orders/
    Get all orders for the authenticated user
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(user=request.user).prefetch_related(
            "items__product", "address"
        )
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class OrderDetailView(APIView):
    """
    GET /api/orders/<order_id>/
    Get details of a specific order
    """

    permission_classes = [IsAuthenticated]

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
    Cancel an order - only allowed if status is PAID
    """

    permission_classes = [IsAuthenticated]

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

        serializer = OrderSerializer(order)
        return Response(
            {"message": "Order cancelled successfully", "order": serializer.data},
            status=status.HTTP_200_OK,
        )


class AddressListCreateView(APIView):
    """
    GET /api/addresses/ - List all addresses
    POST /api/addresses/ - Create new address
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        addresses = Address.objects.filter(user=request.user, is_active=True)
        serializer = AddressSerializer(addresses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = AddressSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AddressDetailView(APIView):
    """
    GET /api/addresses/<address_id>/ - Get address details
    PUT /api/addresses/<address_id>/ - Update address
    DELETE /api/addresses/<address_id>/ - Delete address (soft delete)
    """

    permission_classes = [IsAuthenticated]

    def get_object(self, address_id, user):
        try:
            return Address.objects.get(id=address_id, user=user, is_active=True)
        except Address.DoesNotExist:
            return None

    def get(self, request, address_id):
        address = self.get_object(address_id, request.user)
        if not address:
            return Response(
                {"error": "Address not found"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = AddressSerializer(address)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, address_id):
        address = self.get_object(address_id, request.user)
        if not address:
            return Response(
                {"error": "Address not found"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = AddressSerializer(address, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, address_id):
        address = self.get_object(address_id, request.user)
        if not address:
            return Response(
                {"error": "Address not found"}, status=status.HTTP_404_NOT_FOUND
            )
        # Soft delete
        address.is_active = False
        address.save()
        return Response(
            {"message": "Address deleted successfully"}, status=status.HTTP_200_OK
        )


# ============== Admin Order Views ==============


class AdminOrderDetailView(APIView):
    """
    GET /api/admin/orders/<order_id>/
    Admin view to get order details by order ID
    Only accessible by users with ADMIN role
    """

    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, order_id):
        try:
            order = Order.objects.prefetch_related("items__product", "address").get(
                id=order_id
            )
            serializer = OrderSerializer(order)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND
            )
