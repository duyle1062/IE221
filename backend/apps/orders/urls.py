from django.urls import path
from .views import (
    PlaceOrderView,
    OrderListView,
    OrderDetailView,
    CancelOrderView,
)

app_name = "orders"

urlpatterns = [
    # Order endpoints
    path("place/", PlaceOrderView.as_view(), name="place-order"),
    path("", OrderListView.as_view(), name="order-list"),
    path("<int:order_id>/", OrderDetailView.as_view(), name="order-detail"),
    path("<int:order_id>/cancel/", CancelOrderView.as_view(), name="cancel-order"),
]
