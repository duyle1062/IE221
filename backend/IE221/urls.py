from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView

urlpatterns = [
    # path("admin/", admin.site.urls),
    
    # Authentication URLs using Djoser
    path("auth/", include("djoser.urls")),
    path("auth/login/", include("djoser.urls.jwt")),
    
    path("api/users/", include("apps.users.urls")),
    path("api/auth/", include("apps.authentication.urls")),
]

urlpatterns += [re_path(r"^.*", TemplateView.as_view(template_name="index.html"))]