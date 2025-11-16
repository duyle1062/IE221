from django.urls import path
from .views import AdminOrderListView, AdminChangeStatusView

app_name = "admin_orders"

urlpatterns = [
    # Admin order endpoints
    path("orders/", AdminOrderListView.as_view(), name="admin-order-list"),
    path("orders/<int:order_id>/update-status/", AdminChangeStatusView.as_view(), name="admin-order-update"),
]
