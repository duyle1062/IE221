from django.urls import path
from .views import (
    PlaceOrderView,
    OrderListView,
    OrderDetailView,
    AddressListCreateView,
    AddressDetailView,
)

app_name = "orders"

urlpatterns = [
    # Order endpoints
    path("place/", PlaceOrderView.as_view(), name="place-order"),
    path("", OrderListView.as_view(), name="order-list"),
    path("<int:order_id>/", OrderDetailView.as_view(), name="order-detail"),
    # Address endpoints
    path("addresses/", AddressListCreateView.as_view(), name="address-list-create"),
    path(
        "addresses/<int:address_id>/",
        AddressDetailView.as_view(),
        name="address-detail",
    ),
]
