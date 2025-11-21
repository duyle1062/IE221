"""
URL configuration for Recommendation System
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .recommendation_views import (
    RecommendationViewSet,
    get_user_interactions,
    get_stored_recommendations,
    get_popular_products
)

router = DefaultRouter()
router.register(r'recommendations', RecommendationViewSet, basename='recommendation')

urlpatterns = [
    path('', include(router.urls)),
    path('interactions/my/', get_user_interactions, name='user-interactions'),
    path('recommendations/stored/', get_stored_recommendations, name='stored-recommendations'),
    path('products/popular/', get_popular_products, name='popular-products'),
]
