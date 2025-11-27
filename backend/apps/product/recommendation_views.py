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
from django.utils import timezone
from datetime import timedelta

from .models import Product, Interact, Recommendation
from .serializers import ProductSerializer, InteractSerializer, RecommendationSerializer
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
        """
        Get personalized recommendations using Hybrid Waterfall Strategy

        This endpoint intelligently serves recommendations from:
        1. Cache (Redis) - Fastest (~10ms)
        2. Stored DB - Fast (~50ms)
        3. Real-time calculation - Slow (~2-5s, only for new users)

        Frontend only needs to call this one endpoint.
        """
        user = request.user
        limit = int(request.query_params.get("limit", 10))

        # Service handles all the waterfall logic internally
        recommendations = RecommendationService.get_user_recommendations(user, limit)

        serializer = self.get_serializer(recommendations, many=True)

        return Response(
            {
                "count": len(serializer.data),
                "next": None,
                "previous": None,
                "results": serializer.data,
            }
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="similar/(?P<product_id>[^/.]+)",
        permission_classes=[
            AllowAny
        ],  # ✅ Allow both authenticated and anonymous users
    )
    def similar_products(self, request, product_id=None):
        """
        Get products similar to the specified product

        Available to all users (authenticated or not) since it's product-based,
        not user-based recommendation.
        """
        product = get_object_or_404(
            Product, id=product_id, is_active=True, available=True
        )
        limit = int(request.query_params.get("limit", 6))

        similar = RecommendationService.get_similar_products(product, limit)
        serializer = self.get_serializer(similar, many=True)

        return Response(
            {
                "count": len(serializer.data),
                "next": None,
                "previous": None,
                "results": serializer.data,
            }
        )

    @action(detail=False, methods=["post"])
    def track_interaction(self, request):
        """
        Track user interaction with a product (view/click)
        Body: {"product_id": 123}
        """
        user = request.user
        product_id = request.data.get("product_id")

        if not product_id:
            return Response(
                {"error": "product_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        product = get_object_or_404(Product, id=product_id)

        # Track the interaction
        RecommendationService.track_interaction(user, product)

        return Response(
            {
                "message": "Interaction tracked successfully",
                "product_id": product.id,
                "product_name": product.name,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated])
    def update_my_recommendations(self, request):
        """
        Manually trigger recommendation update for current user
        Admin or user themselves can trigger this
        """
        user = request.user
        RecommendationService.update_user_recommendations(user)

        return Response(
            {"message": "Recommendations updated successfully", "user_id": user.id}
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_interactions(request):
    """
    Get interaction history for the authenticated user
    Query params:
    - limit: number of interactions to return (default: 20)
    """
    user = request.user
    limit = int(request.query_params.get("limit", 20))

    interactions = Interact.objects.filter(
        user=user,
        product__deleted_at__isnull=True  # Only show interactions with active products
    ).select_related("product")[:limit]

    serializer = InteractSerializer(interactions, many=True)

    return Response({"count": interactions.count(), "interactions": serializer.data})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_stored_recommendations(request):
    """
    [UTILITY ENDPOINT] Get raw stored recommendations from database

    This is mainly for debugging/admin purposes.
    Regular users should use GET /api/recommendations/ instead,
    which intelligently handles cache/DB/real-time via Hybrid Waterfall.
    """
    user = request.user

    try:
        recommendation = Recommendation.objects.get(user=user)
        serializer = RecommendationSerializer(recommendation)

        # Add freshness info
        is_stale = recommendation.updated_at < timezone.now() - timedelta(
            hours=RecommendationService.STALE_THRESHOLD
        )

        return Response(
            {
                **serializer.data,
                "is_stale": is_stale,
                "freshness_threshold_hours": RecommendationService.STALE_THRESHOLD,
            }
        )
    except Recommendation.DoesNotExist:
        return Response(
            {
                "message": "No stored recommendations found. Use GET /api/recommendations/ to generate.",
                "user_id": user.id,
            },
            status=status.HTTP_404_NOT_FOUND,
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def get_popular_products(request):
    """
    Get popular products based on interactions and ratings
    No authentication required
    """
    limit = int(request.query_params.get("limit", 10))

    popular = (
        Product.objects.filter(
            is_active=True,
            available=True,
            deleted_at__isnull=True  # Exclude soft-deleted products
        )
        .select_related("category")  # ✅ ADD: Optimize query
        .prefetch_related("images")  # ✅ ADD: Optimize query
        .annotate(
            interaction_count=Count("interact"),
            avg_rating=Avg("ratings__rating"),
            rating_count=Count("ratings"),
        )
        .order_by("-interaction_count", "-avg_rating")[:limit]
    )

    serializer = ProductSerializer(popular, many=True)

    return Response(
        {
            "count": len(serializer.data),
            "next": None,
            "previous": None,
            "results": serializer.data,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def get_best_sellers(request):
    """
    Get best selling products based on actual order data
    Public endpoint - No authentication required
    Returns products sorted by quantity sold (no revenue data)
    
    Query params:
    - limit: number of products to return (default: 10, max: 20)
    - days: filter orders from last N days (optional)
    """
    from apps.orders.models import OrderItem
    from apps.payment.models import Payment, PaymentStatus
    from django.db.models import Sum, F
    
    limit = int(request.query_params.get("limit", 10))
    days = request.query_params.get("days")
    
    # Validate limit
    if limit < 1 or limit > 20:
        return Response(
            {"error": "limit must be between 1 and 20"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    
    # Get order items from succeeded payments only
    succeeded_payments = Payment.objects.filter(
        status=PaymentStatus.SUCCEEDED
    ).values_list("order_id", flat=True)
    
    order_items = OrderItem.objects.filter(order_id__in=succeeded_payments)
    
    # Apply date filter if provided
    if days:
        try:
            days_int = int(days)
            cutoff_date = timezone.now() - timedelta(days=days_int)
            order_items = order_items.filter(order__created_at__gte=cutoff_date)
        except ValueError:
            return Response(
                {"error": "days must be a valid integer"},
                status=status.HTTP_400_BAD_REQUEST,
            )
    
    # Aggregate by product and get quantity sold
    product_stats = (
        order_items
        .values("product_id")
        .annotate(quantity_sold=Sum("quantity"))
        .order_by("-quantity_sold")[:limit]
    )
    
    # Get product IDs
    product_ids = [item["product_id"] for item in product_stats]
    
    if not product_ids:
        return Response(
            {
                "count": 0,
                "next": None,
                "previous": None,
                "results": [],
            },
            status=status.HTTP_200_OK,
        )
    
    # Query actual Product objects with quantity_sold annotation
    products = (
        Product.objects.filter(
            id__in=product_ids,
            is_active=True,
            available=True,
            deleted_at__isnull=True
        )
        .select_related("category")
        .prefetch_related("images")
    )
    
    # Create product dict with quantity_sold
    product_dict = {p.id: p for p in products}
    quantity_dict = {item["product_id"]: item["quantity_sold"] for item in product_stats}
    
    # Maintain order by quantity_sold
    ordered_products = [
        product_dict[pid] for pid in product_ids if pid in product_dict
    ]
    
    # Serialize products
    serializer = ProductSerializer(ordered_products, many=True)
    
    # Add quantity_sold to each product in response
    results = serializer.data
    for product_data in results:
        product_data["quantity_sold"] = quantity_dict.get(product_data["id"], 0)
    
    return Response(
        {
            "count": len(results),
            "next": None,
            "previous": None,
            "results": results,
        },
        status=status.HTTP_200_OK,
    )

