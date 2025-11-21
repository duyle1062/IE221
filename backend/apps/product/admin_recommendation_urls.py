"""
URL configuration for Admin Recommendation System
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .admin_recommendation_views import AdminRecommendationViewSet

router = DefaultRouter()
router.register(r'recommendations', AdminRecommendationViewSet, basename='admin-recommendation')

urlpatterns = [
    path('', include(router.urls)),
]
