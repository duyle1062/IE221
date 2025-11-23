from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db import transaction
from decimal import Decimal
import secrets
import string

from .models import (
    GroupOrder,
    GroupOrderMember,
    GroupOrderItem,
    Order,
    OrderItem,
    Address,
)
from apps.product.models import Product
from .serializers import (
    GroupOrderSerializer,
    GroupOrderMemberSerializer,
    GroupOrderItemSerializer,
    JoinGroupOrderSerializer,
    AddGroupOrderItemSerializer,
    UpdateGroupOrderItemSerializer,
    PlaceGroupOrderSerializer,
    OrderSerializer,
)


def generate_group_code(length=8):
    """Generate a unique random code for group orders"""
    characters = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(characters) for _ in range(length))


class CreateGroupOrderView(APIView):
    """
    POST /api/group-orders/
    Create a new group order and add creator as first member
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        with transaction.atomic():
            # Generate unique code
            code = generate_group_code()
            while GroupOrder.objects.filter(code=code).exists():
                code = generate_group_code()

            # Create group order
            group_order = GroupOrder.objects.create(
                creator=request.user, code=code, status="PENDING"
            )

            # Add creator as first member
            GroupOrderMember.objects.create(group_order=group_order, user=request.user)

            serializer = GroupOrderSerializer(group_order)
            return Response(serializer.data, status=status.HTTP_201_CREATED)


class JoinGroupOrderView(APIView):
    """
    POST /api/group-orders/join/
    Join a group order using code
    Body: {"code": "ABC12345"}
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = JoinGroupOrderSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        code = serializer.validated_data["code"]

        try:
            group_order = GroupOrder.objects.get(code=code)
        except GroupOrder.DoesNotExist:
            return Response(
                {"error": "Group order not found with this code"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if group order is still pending
        if group_order.status != "PENDING":
            return Response(
                {"error": "This group order has already been placed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if user is already a member
        if GroupOrderMember.objects.filter(
            group_order=group_order, user=request.user
        ).exists():
            return Response(
                {"error": "You are already a member of this group order"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Add user as member
        GroupOrderMember.objects.create(group_order=group_order, user=request.user)

        group_serializer = GroupOrderSerializer(group_order)
        return Response(
            {
                "message": "Successfully joined group order",
                "group_order": group_serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class GroupOrderMembersView(APIView):
    """
    GET /api/group-orders/<id>/members/
    List all members in a group order
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, group_order_id):
        try:
            group_order = GroupOrder.objects.get(id=group_order_id)
        except GroupOrder.DoesNotExist:
            return Response(
                {"error": "Group order not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Check if user is a member
        if not GroupOrderMember.objects.filter(
            group_order=group_order, user=request.user
        ).exists():
            return Response(
                {"error": "You are not a member of this group order"},
                status=status.HTTP_403_FORBIDDEN,
            )

        members = group_order.members.all()
        serializer = GroupOrderMemberSerializer(members, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class GroupOrderItemsView(APIView):
    """
    GET /api/group-orders/<id>/items/
    List all items in a group order

    POST /api/group-orders/<id>/items/
    Add an item to group order
    Body: {"product_id": 1, "quantity": 2}
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, group_order_id):
        try:
            group_order = GroupOrder.objects.get(id=group_order_id)
        except GroupOrder.DoesNotExist:
            return Response(
                {"error": "Group order not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Check if user is a member
        if not GroupOrderMember.objects.filter(
            group_order=group_order, user=request.user
        ).exists():
            return Response(
                {"error": "You are not a member of this group order"},
                status=status.HTTP_403_FORBIDDEN,
            )

        items = group_order.items.filter(is_active=True)
        serializer = GroupOrderItemSerializer(items, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, group_order_id):
        serializer = AddGroupOrderItemSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            group_order = GroupOrder.objects.get(id=group_order_id)
        except GroupOrder.DoesNotExist:
            return Response(
                {"error": "Group order not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Check if group order is still pending
        if group_order.status != "PENDING":
            return Response(
                {"error": "Cannot add items. Group order has already been placed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if user is a member
        if not GroupOrderMember.objects.filter(
            group_order=group_order, user=request.user
        ).exists():
            return Response(
                {"error": "You must be a member to add items"},
                status=status.HTTP_403_FORBIDDEN,
            )

        product_id = serializer.validated_data["product_id"]
        quantity = serializer.validated_data["quantity"]

        # Get product
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Check product availability
        if not product.is_active or not product.available:
            return Response(
                {"error": f"Product '{product.name}' is not available"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Calculate line total
        line_total = product.price * quantity

        # Create group order item
        group_item = GroupOrderItem.objects.create(
            group_order=group_order,
            user=request.user,
            product=product,
            product_name=product.name,
            unit_price=product.price,
            quantity=quantity,
            line_total=line_total,
        )

        item_serializer = GroupOrderItemSerializer(group_item)
        return Response(item_serializer.data, status=status.HTTP_201_CREATED)


class GroupOrderItemDetailView(APIView):
    """
    PATCH /api/group-orders/<id>/items/<item_id>/
    DELETE /api/group-orders/<id>/items/<item_id>/
    Update or delete a group order item (only by item owner)
    """

    permission_classes = [IsAuthenticated]

    def patch(self, request, group_order_id, item_id):
        serializer = UpdateGroupOrderItemSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            group_item = GroupOrderItem.objects.select_related("group_order").get(
                id=item_id,
                group_order_id=group_order_id,
                is_active=True,
            )
        except GroupOrderItem.DoesNotExist:
            return Response(
                {"error": "Item not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if user is the item owner OR the group creator (host)
        is_item_owner = group_item.user == request.user
        is_host = group_item.group_order.creator == request.user

        if not (is_item_owner or is_host):
            return Response(
                {"error": "Only the item owner or group host can update this item"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check if group order is still pending
        if group_item.group_order.status != "PENDING":
            return Response(
                {"error": "Cannot update items. Group order has already been placed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        quantity = serializer.validated_data["quantity"]
        group_item.quantity = quantity
        group_item.line_total = group_item.unit_price * quantity
        group_item.save()

        item_serializer = GroupOrderItemSerializer(group_item)
        return Response(item_serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, group_order_id, item_id):
        try:
            group_item = GroupOrderItem.objects.select_related("group_order").get(
                id=item_id,
                group_order_id=group_order_id,
                is_active=True,
            )
        except GroupOrderItem.DoesNotExist:
            return Response(
                {"error": "Item not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if user is the item owner OR the group creator (host)
        is_item_owner = group_item.user == request.user
        is_host = group_item.group_order.creator == request.user

        if not (is_item_owner or is_host):
            return Response(
                {"error": "Only the item owner or group host can delete this item"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check if group order is still pending
        if group_item.group_order.status != "PENDING":
            return Response(
                {"error": "Cannot delete items. Group order has already been placed"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if group_item.group_order.status != "PENDING":
            return Response(
                {"error": "Cannot delete items. Group order has already been placed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Soft delete
        group_item.is_active = False
        group_item.save()

        return Response(
            {"message": "Item removed successfully"}, status=status.HTTP_200_OK
        )


class PlaceGroupOrderView(APIView):
    """
    POST /api/group-orders/<id>/place/
    Creator places the group order (converts to regular order)
    Body: {"address_id": 1, "payment_method": "CASH", ...}
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, group_order_id):
        serializer = PlaceGroupOrderSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            group_order = GroupOrder.objects.prefetch_related("items").get(
                id=group_order_id
            )
        except GroupOrder.DoesNotExist:
            return Response(
                {"error": "Group order not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Check if user is the creator
        if group_order.creator != request.user:
            return Response(
                {"error": "Only the creator can place the group order"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check if group order is still pending
        if group_order.status != "PENDING":
            return Response(
                {"error": "Group order has already been placed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if there are items
        group_items = group_order.items.filter(is_active=True)
        if not group_items.exists():
            return Response(
                {"error": "Cannot place order. Group order has no items"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get validated data
        address_id = serializer.validated_data["address_id"]
        payment_method = serializer.validated_data["payment_method"]
        order_type = serializer.validated_data.get("type", "DELIVERY")
        delivery_fee = serializer.validated_data.get("delivery_fee", Decimal("0"))
        discount = serializer.validated_data.get("discount", Decimal("0"))

        # Validate address belongs to creator
        try:
            address = Address.objects.get(
                id=address_id, user=request.user, is_active=True
            )
        except Address.DoesNotExist:
            return Response(
                {"error": "Address not found or not active"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Calculate subtotal from all group items
        subtotal = Decimal("0")
        for item in group_items:
            subtotal += item.line_total

        # Calculate total
        total = subtotal + delivery_fee - discount

        # Create order with transaction
        try:
            with transaction.atomic():
                # Create order with PENDING status
                order = Order.objects.create(
                    user=request.user,  # Creator pays
                    restaurant_id=1,
                    address=address,
                    type=order_type,
                    group_order_id=group_order.id,
                    subtotal=subtotal,
                    delivery_fee=delivery_fee,
                    discount=discount,
                    total=total,
                    payment_method=payment_method,
                    status="PENDING",
                    payment_status="PENDING",
                )

                # Convert group order items to order items
                order_items = []
                for group_item in group_items:
                    order_item = OrderItem(
                        order=order,
                        product=group_item.product,
                        unit_price=group_item.unit_price,
                        quantity=group_item.quantity,
                        line_total=group_item.line_total,
                    )
                    order_items.append(order_item)

                OrderItem.objects.bulk_create(order_items)

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

                    # Update group order status
                    group_order.status = "PAID"
                    group_order.save()

                    order_serializer = OrderSerializer(order)
                    return Response(
                        {
                            "message": "Group order placed successfully",
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
                        order_info=f"Thanh toan don hang nhom #{group_order.id}",
                        ip_address=ip_address,
                        payment_method=payment_method,
                    )

                    if result["success"]:
                        # Store transaction reference
                        payment.gateway_transaction_id = result["txn_ref"]
                        payment.save()

                        order_serializer = OrderSerializer(order)
                        return Response(
                            {
                                "message": "Group order created, please complete payment",
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
            return Response(
                {"error": f"Failed to place group order: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class GroupOrderDetailView(APIView):
    """
    GET /api/group-orders/<id>/
    Get group order details
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, group_order_id):
        try:
            group_order = GroupOrder.objects.prefetch_related("members", "items").get(
                id=group_order_id
            )
        except GroupOrder.DoesNotExist:
            return Response(
                {"error": "Group order not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Check if user is a member
        if not GroupOrderMember.objects.filter(
            group_order=group_order, user=request.user
        ).exists():
            return Response(
                {"error": "You are not a member of this group order"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = GroupOrderSerializer(group_order)
        return Response(serializer.data, status=status.HTTP_200_OK)
