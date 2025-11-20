from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from django.db import transaction

from .models import Payment
from .serializers import (
    PaymentSerializer,
    CreatePaymentSerializer,
)
from .vnpay_service import VNPayService
from apps.orders.models import Order


class CreatePaymentView(APIView):
    """
    POST /api/payments/create/
    Create payment for an order
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreatePaymentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        order_id = serializer.validated_data["order_id"]

        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found or you don't have permission"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if order already has payment
        if Payment.objects.filter(order=order).exists():
            return Response(
                {"error": "Payment already exists for this order"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create payment record
        payment = Payment.objects.create(
            order=order,
            amount=order.total,
            method=order.payment_method,
            status="PENDING",
        )

        # Handle CASH payment - auto succeed
        if order.payment_method == "CASH":
            with transaction.atomic():
                payment.status = "SUCCEEDED"
                payment.save()

                order.status = "PAID"
                order.payment_status = "SUCCEEDED"
                order.save()

            return Response(
                {
                    "message": "Cash payment successful",
                    "payment": PaymentSerializer(payment).data,
                },
                status=status.HTTP_200_OK,
            )

        # Handle gateway payments (CARD, WALLET, THIRD_PARTY)
        else:
            vnpay_service = VNPayService()

            # Convert amount to integer (VND doesn't use decimal)
            amount = int(order.total)

            # Get client IP address
            ip_address = self._get_client_ip(request)

            result = vnpay_service.create_payment(
                order_id=order.id,
                amount=amount,
                order_info=f"Thanh toan don hang #{order.id}",
                ip_address=ip_address,
                payment_method=order.payment_method,
            )

            if result["success"]:
                # Store transaction reference for later verification
                payment.gateway_transaction_id = result["txn_ref"]
                payment.save()

                return Response(
                    {
                        "message": "Payment initiated",
                        "payment": PaymentSerializer(payment).data,
                        "payment_url": result["payment_url"],
                    },
                    status=status.HTTP_201_CREATED,
                )
            else:
                # Delete payment if VNPAY request failed
                payment.delete()
                return Response(
                    {
                        "error": "Failed to initiate payment",
                        "message": result.get("message"),
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

    def _get_client_ip(self, request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0]
        else:
            ip = request.META.get("REMOTE_ADDR")
        return ip


class VNPayReturnView(APIView):
    """
    GET /api/payments/vnpay/return/
    Handle return URL from VNPAY after payment
    This is called when user is redirected back from VNPAY
    """

    permission_classes = [AllowAny]  # Public endpoint, verified by signature

    def get(self, request):
        # Get all query parameters
        params = dict(request.query_params)

        # Convert lists to single values (QueryDict returns lists)
        params = {k: v[0] if isinstance(v, list) else v for k, v in params.items()}

        # Verify and process payment
        vnpay_service = VNPayService()
        result = vnpay_service.verify_return_url(params)

        if not result.get("valid"):
            return Response(
                {"error": result.get("message", "Invalid payment verification")},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Extract order ID from transaction reference (format: orderid_timestamp)
        txn_ref = result.get("txn_ref", "")
        try:
            order_id = int(txn_ref.split("_")[0])
        except (ValueError, IndexError):
            return Response(
                {"error": "Invalid transaction reference"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            order = Order.objects.get(id=order_id)
            payment = Payment.objects.get(order=order)
        except (Order.DoesNotExist, Payment.DoesNotExist):
            return Response(
                {"error": "Order or payment not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        with transaction.atomic():
            if result.get("success"):
                # Payment successful
                payment.status = "SUCCEEDED"
                payment.gateway_transaction_id = result.get("transaction_no", txn_ref)
                payment.save()

                order.status = "PAID"
                order.payment_status = "SUCCEEDED"
                order.save()

                return Response(
                    {
                        "message": "Payment successful",
                        "order_id": order.id,
                        "amount": result.get("amount"),
                        "transaction_no": result.get("transaction_no"),
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                # Payment failed
                payment.status = "FAILED"
                payment.save()

                order.payment_status = "FAILED"
                order.save()

                return Response(
                    {
                        "error": "Payment failed",
                        "message": result.get("message"),
                        "response_code": result.get("response_code"),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )


class PaymentDetailView(APIView):
    """
    GET /api/payments/{payment_id}/
    Get payment details
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, payment_id):
        try:
            payment = Payment.objects.select_related("order").get(
                id=payment_id, order__user=request.user
            )
        except Payment.DoesNotExist:
            return Response(
                {"error": "Payment not found"}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = PaymentSerializer(payment)
        return Response(serializer.data, status=status.HTTP_200_OK)
