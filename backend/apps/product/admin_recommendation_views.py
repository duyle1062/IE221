"""
Admin views for Recommendation System
Allows admin to view statistics, manage interactions, and trigger batch updates
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.users.permissions import IsAdminUser
from django.db.models import Count, Avg, Q
from django.utils import timezone
from datetime import timedelta

from .models import Product, Interact, Recommendation, Ratings
from .serializers import InteractSerializer, RecommendationSerializer, RatingSerializer
from .recommendation_service import RecommendationService


class AdminRecommendationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin ViewSet for managing recommendation system

    Endpoints:
    - GET /api/admin/recommendations/interactions/ - List all interactions
    - GET /api/admin/recommendations/recommendations/ - List all recommendations
    - GET /api/admin/recommendations/statistics/ - Get system statistics
    - POST /api/admin/recommendations/batch_update/ - Trigger batch update
    - DELETE /api/admin/recommendations/clear_sample_data/ - Clear sample data
    """

    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        return Recommendation.objects.none()

    @action(detail=False, methods=["get"])
    def interactions(self, request):
        """List all interactions with filtering - OPTIMIZED"""
        user_id = request.query_params.get("user_id")
        product_id = request.query_params.get("product_id")
        days = request.query_params.get("days", 30)  # Last N days

        # ✅ ALREADY OPTIMIZED: select_related for user, product, and category
        queryset = Interact.objects.select_related(
            "user", "product", "product__category"
        )

        # Filter by user
        if user_id:
            queryset = queryset.filter(user_id=user_id)

        # Filter by product
        if product_id:
            queryset = queryset.filter(product_id=product_id)

        # Filter by date range
        if days:
            date_from = timezone.now() - timedelta(days=int(days))
            queryset = queryset.filter(created_at__gte=date_from)

        # Pagination
        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 20))
        start = (page - 1) * page_size
        end = start + page_size

        total = queryset.count()
        interactions = queryset.order_by("-created_at")[start:end]

        serializer = InteractSerializer(interactions, many=True)

        return Response(
            {
                "total": total,
                "page": page,
                "page_size": page_size,
                "results": serializer.data,
            }
        )

    @action(detail=False, methods=["get"])
    def recommendations(self, request):
        """List all stored recommendations"""
        user_id = request.query_params.get("user_id")

        queryset = Recommendation.objects.select_related("user")

        if user_id:
            queryset = queryset.filter(user_id=user_id)

        # Pagination
        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 20))
        start = (page - 1) * page_size
        end = start + page_size

        total = queryset.count()
        recommendations = queryset.order_by("-updated_at")[start:end]

        serializer = RecommendationSerializer(recommendations, many=True)

        return Response(
            {
                "total": total,
                "page": page,
                "page_size": page_size,
                "results": serializer.data,
            }
        )

    @action(detail=False, methods=["get"])
    def statistics(self, request):
        """Get recommendation system statistics"""
        days = int(request.query_params.get("days", 30))
        date_from = timezone.now() - timedelta(days=days)

        # Interaction statistics
        total_interactions = Interact.objects.count()
        recent_interactions = Interact.objects.filter(created_at__gte=date_from).count()

        # User statistics
        total_users_with_interactions = (
            Interact.objects.values("user").distinct().count()
        )
        active_users = (
            Interact.objects.filter(created_at__gte=date_from)
            .values("user")
            .distinct()
            .count()
        )

        # Product statistics
        products_with_interactions = (
            Interact.objects.values("product").distinct().count()
        )
        total_products = Product.objects.filter(is_active=True, available=True).count()

        # Rating statistics
        total_ratings = Ratings.objects.count()
        avg_rating = Ratings.objects.aggregate(avg=Avg("rating"))["avg"] or 0

        # Recommendation coverage
        users_with_recommendations = Recommendation.objects.count()

        # Top interacted products
        top_products = (
            Interact.objects.filter(created_at__gte=date_from)
            .values("product__id", "product__name")
            .annotate(interaction_count=Count("id"))
            .order_by("-interaction_count")[:10]
        )

        # Most active users
        top_users = (
            Interact.objects.filter(created_at__gte=date_from)
            .values("user__id", "user__email")
            .annotate(interaction_count=Count("id"))
            .order_by("-interaction_count")[:10]
        )

        return Response(
            {
                "period_days": days,
                "interactions": {
                    "total": total_interactions,
                    "recent": recent_interactions,
                    "avg_per_user": (
                        round(total_interactions / total_users_with_interactions, 2)
                        if total_users_with_interactions
                        else 0
                    ),
                },
                "users": {
                    "total_with_interactions": total_users_with_interactions,
                    "active_recently": active_users,
                    "with_recommendations": users_with_recommendations,
                },
                "products": {
                    "total": total_products,
                    "with_interactions": products_with_interactions,
                    "coverage_percentage": (
                        round((products_with_interactions / total_products * 100), 2)
                        if total_products
                        else 0
                    ),
                },
                "ratings": {"total": total_ratings, "average": round(avg_rating, 2)},
                "top_products": list(top_products),
                "top_users": list(top_users),
            }
        )

    @action(detail=False, methods=["post"])
    def batch_update(self, request):
        """Trigger batch recommendation update for active users"""
        days = int(request.data.get("days", 7))
        limit = int(request.data.get("limit", 100))

        date_from = timezone.now() - timedelta(days=days)

        # Get active users
        from apps.users.models import UserAccount

        active_users = UserAccount.objects.filter(
            interact__created_at__gte=date_from
        ).distinct()[:limit]

        updated_count = 0
        errors = []

        for user in active_users:
            try:
                RecommendationService.update_user_recommendations(user)
                updated_count += 1
            except Exception as e:
                errors.append(
                    {"user_id": user.id, "user_email": user.email, "error": str(e)}
                )

        return Response(
            {
                "message": f"Batch update completed",
                "updated": updated_count,
                "total_users": active_users.count(),
                "errors": errors,
            }
        )

    @action(detail=False, methods=["delete"])
    def clear_sample_data(self, request):
        """Clear sample data (interactions and ratings with [Sample] prefix)"""
        confirm = request.data.get("confirm", False)

        if not confirm:
            return Response(
                {"error": 'Please confirm by sending {"confirm": true}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Delete sample interactions
        interactions_deleted = Interact.objects.all().delete()[0]

        # Delete sample ratings
        ratings_deleted = Ratings.objects.filter(
            comment__startswith="[Sample]"
        ).delete()[0]

        # Delete all recommendations (they'll be regenerated)
        recommendations_deleted = Recommendation.objects.all().delete()[0]

        return Response(
            {
                "message": "Sample data cleared successfully",
                "deleted": {
                    "interactions": interactions_deleted,
                    "ratings": ratings_deleted,
                    "recommendations": recommendations_deleted,
                },
            }
        )

    @action(detail=False, methods=["get"])
    def ratings(self, request):
        """List all ratings with filtering"""
        user_id = request.query_params.get("user_id")
        product_id = request.query_params.get("product_id")
        min_rating = request.query_params.get("min_rating")
        days = request.query_params.get("days", 30)

        queryset = Ratings.objects.select_related("user", "product")

        if user_id:
            queryset = queryset.filter(user_id=user_id)

        if product_id:
            queryset = queryset.filter(product_id=product_id)

        if min_rating:
            queryset = queryset.filter(rating__gte=int(min_rating))

        if days:
            date_from = timezone.now() - timedelta(days=int(days))
            queryset = queryset.filter(created_at__gte=date_from)

        # Pagination
        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 20))
        start = (page - 1) * page_size
        end = start + page_size

        total = queryset.count()
        ratings = queryset.order_by("-created_at")[start:end]

        serializer = RatingSerializer(ratings, many=True)

        return Response(
            {
                "total": total,
                "page": page,
                "page_size": page_size,
                "results": serializer.data,
            }
        )
