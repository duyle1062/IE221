from django.urls import path
from .views import (
    CreatePaymentView,
    VNPayReturnView,
    PaymentDetailView,
)

app_name = "payment"

urlpatterns = [
    # Create payment
    path("create/", CreatePaymentView.as_view(), name="create_payment"),
    # VNPAY return URL handler
    path("vnpay/return/", VNPayReturnView.as_view(), name="vnpay_return"),
    # Payment detail
    path("<int:payment_id>/", PaymentDetailView.as_view(), name="payment_detail"),
]
