from django.urls import path
from .reports_views import (
    RevenueReportView,
    TopProductsReportView,
    OrderRatioReportView,
)

urlpatterns = [
    path("revenue/", RevenueReportView.as_view(), name="revenue-report"),
    path("top-products/", TopProductsReportView.as_view(), name="top-products-report"),
    path("order-ratio/", OrderRatioReportView.as_view(), name="order-ratio-report"),
]
