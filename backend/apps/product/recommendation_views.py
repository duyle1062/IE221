"""
Views for Recommendation System
Handles recommendation retrieval, interaction tracking, and similar products
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.db.models import Avg, Count

from .models import Product, Interact, Recommendation
from .serializers import (
    ProductSerializer, 
    InteractSerializer, 
    RecommendationSerializer
)
from .recommendation_service import RecommendationService


class RecommendationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for managing user recommendations
    
    Endpoints:
    - GET /api/recommendations/ - Get current user's recommendations
    - GET /api/recommendations/similar/{product_id}/ - Get similar products
    - POST /api/recommendations/track_interaction/ - Track product interaction
    """
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Not used, but required by DRF"""
        return Product.objects.none()
    
    def list(self, request):
        """Get personalized recommendations for the authenticated user"""
        user = request.user
        limit = int(request.query_params.get('limit', 10))
        
        # Get recommendations from service
        recommendations = RecommendationService.get_user_recommendations(user, limit)
        serializer = self.get_serializer(recommendations, many=True)
        
        return Response({
            'count': len(recommendations),
            'results': serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='similar/(?P<product_id>[^/.]+)')
    def similar_products(self, request, product_id=None):
        """Get products similar to the specified product"""
        product = get_object_or_404(Product, id=product_id, is_active=True, available=True)
        limit = int(request.query_params.get('limit', 6))
        
        similar = RecommendationService.get_similar_products(product, limit)
        serializer = self.get_serializer(similar, many=True)
        
        return Response({
            'product_id': product.id,
            'product_name': product.name,
            'similar_products': serializer.data
        })
    
    @action(detail=False, methods=['post'])
    def track_interaction(self, request):
        """
        Track user interaction with a product (view/click)
        Body: {"product_id": 123}
        """
        user = request.user
        product_id = request.data.get('product_id')
        
        if not product_id:
            return Response(
                {'error': 'product_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        product = get_object_or_404(Product, id=product_id)
        
        # Track the interaction
        RecommendationService.track_interaction(user, product)
        
        return Response({
            'message': 'Interaction tracked successfully',
            'product_id': product.id,
            'product_name': product.name
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def update_my_recommendations(self, request):
        """
        Manually trigger recommendation update for current user
        Admin or user themselves can trigger this
        """
        user = request.user
        RecommendationService.update_user_recommendations(user)
        
        return Response({
            'message': 'Recommendations updated successfully',
            'user_id': user.id
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_interactions(request):
    """
    Get interaction history for the authenticated user
    Query params:
    - limit: number of interactions to return (default: 20)
    """
    user = request.user
    limit = int(request.query_params.get('limit', 20))
    
    interactions = Interact.objects.filter(user=user).select_related('product')[:limit]
    
    serializer = InteractSerializer(interactions, many=True)
    
    return Response({
        'count': interactions.count(),
        'interactions': serializer.data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_stored_recommendations(request):
    """
    Get pre-computed recommendations stored in database
    This is faster than computing recommendations on-the-fly
    """
    user = request.user
    
    try:
        recommendation = Recommendation.objects.get(user=user)
        serializer = RecommendationSerializer(recommendation)
        return Response(serializer.data)
    except Recommendation.DoesNotExist:
        # Generate recommendations if not exists
        RecommendationService.update_user_recommendations(user)
        recommendation = Recommendation.objects.get(user=user)
        serializer = RecommendationSerializer(recommendation)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_popular_products(request):
    """
    Get popular products based on interactions and ratings
    No authentication required
    """
    limit = int(request.query_params.get('limit', 10))
    
    popular = (
        Product.objects
        .filter(is_active=True, available=True)
        .annotate(
            interaction_count=Count('interact'),
            avg_rating=Avg('ratings__rating'),
            rating_count=Count('ratings')
        )
        .order_by('-interaction_count', '-avg_rating')[:limit]
    )
    
    serializer = ProductSerializer(popular, many=True)
    
    return Response({
        'count': len(serializer.data),
        'products': serializer.data
    })
