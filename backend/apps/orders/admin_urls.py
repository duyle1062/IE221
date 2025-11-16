from django.urls import path
from .views import AdminOrderDetailView

app_name = "admin_orders"

urlpatterns = [
    # Admin order endpoints
    path(
        "orders/<int:order_id>/",
        AdminOrderDetailView.as_view(),
        name="admin-order-detail",
    ),
]
