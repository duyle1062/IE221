from django.contrib import admin
from django.urls import path, include, re_path
from . import views

urlpatterns = [
    # Djoser authentication endpoints
    path("", include("djoser.urls")),
    path("jwt/", include("djoser.urls.jwt")),

    # Custom frontend-specific views
#     path('login/', views.login_view, name='custom_login'),
#     path('register/', views.register_view, name='custom_register'),
#     path('logout/', views.logout_view, name='custom_logout')
]