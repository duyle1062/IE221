from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView

urlpatterns = [
    path("admin/", admin.site.urls),
    
    # Authentication URLs using Djoser
    # Checkout Djoser base endpoints: https://djoser.readthedocs.io/en/latest/base_endpoints.html
    path("auth/", include("djoser.urls")),
    
    # JWT token management endpoints: https://djoser.readthedocs.io/en/latest/jwt_endpoints.html
    path("auth/login/", include("djoser.urls.jwt")),

    # category list
    path("api/", include("apps.product.urls")),
    
    # API endpoints
    path("api/users/", include("apps.users.urls")),
    # path("api/auth/", include("apps.authentication.urls")),
    path("api/cart", include("apps.carts.urls"))
]

urlpatterns += [re_path(r"^.*", TemplateView.as_view(template_name="index.html"))]