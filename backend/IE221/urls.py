from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static

# Import Router của DRF
from rest_framework.routers import DefaultRouter

# Import ViewSet Admin
from apps.users.views import UserAdminViewSet

admin_router = DefaultRouter()

# Đăng ký các ViewSet của Admin vào router này
#    - 'users' chính là tiền tố URL -> sẽ tạo ra /api/admin/users/
#    - basename='admin-user' là bắt buộc khi dùng get_queryset
admin_router.register(r"users", UserAdminViewSet, basename="admin-user")

urlpatterns = [
    path("admin/", admin.site.urls),
    # Authentication URLs using Djoser
    # Checkout Djoser base endpoints: https://djoser.readthedocs.io/en/latest/base_endpoints.html
    path("api/auth/", include("djoser.urls")),
    # JWT token management endpoints: https://djoser.readthedocs.io/en/latest/jwt_endpoints.html
    path("api/auth/login/", include("djoser.urls.jwt")),
    # Custom auth endpoints (logout)
    path("api/auth/", include("apps.authentication.urls")),
    # category list
    path("api/", include("apps.product.urls")),
    # API endpoints
    path("api/users/", include("apps.users.urls")),
    path("api/cart/", include("apps.carts.urls")),
    path("api/orders/", include("apps.orders.urls")),
    path("api/group-orders/", include("apps.orders.group_order_urls")),
    path("api/addresses/", include("apps.addresses.urls")),
    path("api/payments/", include("apps.payment.urls")),
    # Recommendation system endpoints
    path("api/", include("apps.product.recommendation_urls")),
    # Admin endpoints
    path("api/admin/", include(admin_router.urls)),
    path("api/admin/", include("apps.orders.admin_urls")),
    path("api/admin/reports/", include("apps.orders.reports_urls")),
    path("api/admin/", include("apps.product.admin_recommendation_urls")),
    
    # Health check endpoint
    path("health/", include("health_check.urls")),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Catch-all for frontend - comment out if only using API
# urlpatterns += [re_path(r"^.*", TemplateView.as_view(template_name="index.html"))]
