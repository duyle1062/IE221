"""
Recommendation Service for IE221 Food Ordering Platform
Combines collaborative filtering based on user interactions and ratings
with content-based filtering using product categories
"""

import logging
import time
from django.db.models import Count, Avg, Q, F
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
from collections import defaultdict, Counter
import random
import threading
from typing import List, Dict, Set
from .models import Product, Interact, Recommendation, Ratings, Category

# Configure logger
logger = logging.getLogger(__name__)

# Lock to prevent concurrent Step 3 calculations for same user
_step3_locks = {}


class RecommendationService:
    """Service for generating personalized product recommendations"""

    CACHE_TIMEOUT = 3600  # 1 hour
    TOP_K_RECOMMENDATIONS = 10
    MIN_INTERACTIONS_FOR_COLLABORATIVE = 3
    STALE_THRESHOLD = 24  # Hours - Data considered stale after 24h

    @classmethod
    def track_interaction(cls, user, product):
        """
        Track user interaction asynchronously (non-blocking)
        Uses threading to avoid blocking the HTTP request
        """

        def _async_track():
            try:
                Interact.objects.create(user=user, product=product)
                # Invalidate user's recommendation cache
                cache_key = f"recommendations_user_{user.id}"
                cache.delete(cache_key)
            except Exception as e:
                # Log error but don't crash (fire-and-forget pattern)
                logger.error(f"Async track_interaction failed for user {user.id}: {e}")

        # Fire-and-forget: Start thread and return immediately (~1ms)
        thread = threading.Thread(target=_async_track, daemon=True)
        thread.start()

    @classmethod
    def get_user_recommendations(cls, user, limit=10) -> List[Product]:
        """
        Get personalized recommendations using Hybrid Waterfall Strategy:

        Step 1 (Fastest ~10ms): Check Cache (Redis)
        Step 2 (Fast ~50ms): Check Stored DB (recommendation table)
            - If data is stale (>24h): Return stale data but trigger async update
        Step 3 (Slow ~2-5s): Real-time calculation (fallback for new users)
        """
        cache_key = f"recommendations_user_{user.id}"

        # --- STEP 1: Check Cache (Redis) ---
        # Fastest path: Return cached results immediately
        cached_data = cache.get(cache_key)
        if cached_data:
            return cached_data

        # --- STEP 2: Check Stored DB (recommendation table) ---
        # Fast path: Use pre-computed recommendations from database
        try:
            rec_obj = Recommendation.objects.get(user=user)

            # Check data freshness
            is_stale = rec_obj.updated_at < timezone.now() - timedelta(
                hours=cls.STALE_THRESHOLD
            )

            if is_stale:
                # Data is old -> Trigger async update (user still gets stale data for UX)
                cls._trigger_async_update(user)

            # Get product IDs from stored recommendations
            product_ids = rec_obj.product_ids[:limit]

            if not product_ids:
                # Empty stored recommendations -> Fall through to Step 3
                raise Recommendation.DoesNotExist

            # Query actual Product objects with optimized queries
            products = (
                Product.objects.filter(
                    id__in=product_ids, is_active=True, available=True
                )
                .select_related("category")
                .prefetch_related("images")
            )

            # Maintain ranking order from product_ids (SQL IN doesn't preserve order)
            product_dict = {p.id: p for p in products}
            ordered_products = [
                product_dict[pid] for pid in product_ids if pid in product_dict
            ]

            # Cache the results for next time (Step 1 hit)
            cache.set(cache_key, ordered_products, cls.CACHE_TIMEOUT)

            return ordered_products

        except Recommendation.DoesNotExist:
            # --- STEP 3: Real-time Fallback (New user / No stored data) ---
            # Slowest path: Calculate recommendations from scratch
            pass

        # Use lock to prevent concurrent calculations for same user
        lock_key = f"step3_lock_{user.id}"
        if lock_key not in _step3_locks:
            _step3_locks[lock_key] = threading.Lock()

        with _step3_locks[lock_key]:
            # Double-check cache after acquiring lock (another thread might have computed it)
            cached_data = cache.get(cache_key)
            if cached_data:
                return cached_data

            # Check DB again
            try:
                rec_obj = Recommendation.objects.get(user=user)
                product_ids = rec_obj.product_ids[:limit]
                if product_ids:
                    products = (
                        Product.objects.filter(
                            id__in=product_ids, is_active=True, available=True
                        )
                        .select_related("category")
                        .prefetch_related("images")
                    )
                    product_dict = {p.id: p for p in products}
                    ordered_products = [
                        product_dict[pid] for pid in product_ids if pid in product_dict
                    ]
                    cache.set(cache_key, ordered_products, cls.CACHE_TIMEOUT)
                    return ordered_products
            except Recommendation.DoesNotExist:
                pass

            # Real-time calculation (heavy computation) - log with timing
            logger.warning(
                f"User {user.id} has no stored recommendations, calculating real-time (this is slow)"
            )
            start_time = time.time()

            fresh_recommendations = cls._calculate_recommendations_realtime(user, limit)

            # Save full list to DB for future Step 2 hits (not just limited)
            full_recommendations = cls._calculate_recommendations_realtime(
                user, cls.TOP_K_RECOMMENDATIONS
            )
            product_ids = [p.id for p in full_recommendations]
            Recommendation.objects.update_or_create(
                user=user, defaults={"product_ids": product_ids}
            )

            # Log execution time for Step 3 (critical for performance monitoring)
            execution_time = time.time() - start_time
            logger.info(
                f"Step 3 real-time calculation completed for user {user.id} "
                f"in {execution_time:.2f}s (returned {len(fresh_recommendations)} products)"
            )
            if execution_time > 5.0:
                logger.warning(
                    f"Step 3 took {execution_time:.2f}s for user {user.id} - "
                    "consider optimizing database indexes or pre-computing recommendations"
                )

            # Cache the limited results for future Step 1 hits
            cache.set(cache_key, fresh_recommendations, cls.CACHE_TIMEOUT)

            return fresh_recommendations

    @classmethod
    def _trigger_async_update(cls, user):
        """
        Trigger async recommendation update for stale data.

        In production, use Celery:
            update_recommendations_task.delay(user.id)

        For now, using threading as fallback.
        """
        try:
            import threading

            def run_update():
                try:
                    logger.info(f"Background update started for user {user.id}")
                    cls.update_user_recommendations(user)
                    logger.info(f"Background update completed for user {user.id}")
                except Exception as e:
                    logger.error(f"Background update failed for user {user.id}: {e}")

            thread = threading.Thread(target=run_update, daemon=True)
            thread.start()
        except Exception as e:
            logger.warning(f"Failed to trigger async update: {e}")

    @classmethod
    def _calculate_recommendations_realtime(cls, user, limit=10) -> List[Product]:
        """
        Heavy real-time calculation of recommendations.
        Combines collaborative filtering, content-based, and popularity.

        This is extracted from the old get_user_recommendations logic.
        """
        # Get user's interaction history
        user_interactions = cls._get_user_interaction_history(user)
        user_ratings = cls._get_user_ratings(user)

        # Combine different recommendation strategies
        collaborative_recs = cls._collaborative_filtering(
            user, user_interactions, limit * 2
        )
        content_based_recs = cls._content_based_filtering(
            user, user_interactions, user_ratings, limit * 2
        )
        popular_recs = cls._get_popular_products(limit)

        # Merge and rank recommendations
        final_recommendations = cls._merge_recommendations(
            user,
            collaborative_recs,
            content_based_recs,
            popular_recs,
            user_interactions,
            limit,
        )

        return final_recommendations

    @classmethod
    def _get_user_interaction_history(cls, user) -> Set[int]:
        """Get set of product IDs user has interacted with"""
        return set(
            Interact.objects.filter(user=user).values_list("product_id", flat=True)
        )

    @classmethod
    def _get_user_ratings(cls, user) -> Dict[int, int]:
        """Get user's product ratings"""
        return dict(
            Ratings.objects.filter(user=user).values_list("product_id", "rating")
        )

    @classmethod
    def _collaborative_filtering(
        cls, user, user_interactions: Set[int], limit: int
    ) -> List[Dict]:
        """
        Collaborative filtering based on similar users' interactions
        OPTIMIZED for scale: Time window + caching + limited scope
        """
        if len(user_interactions) < cls.MIN_INTERACTIONS_FOR_COLLABORATIVE:
            return []

        # Cache key for similar users (expires after 6 hours)
        cache_key = f"similar_users_{user.id}"
        cached_similar = cache.get(cache_key)

        if cached_similar:
            similar_user_ids = cached_similar
        else:
            # ✅ OPTIMIZATION: Only consider recent interactions (last 90 days)
            # This dramatically reduces query scope for large datasets
            recent_cutoff = timezone.now() - timedelta(days=90)

            # Find similar users based on common interactions (optimized query)
            similar_users = (
                Interact.objects.filter(
                    product_id__in=list(user_interactions)[
                        :50
                    ],  # Limit to top 50 most recent
                    created_at__gte=recent_cutoff,  # Time window
                )
                .exclude(user=user)
                .values("user_id")
                .annotate(common_count=Count("id"))
                .order_by("-common_count")[:20]  # Top 20 similar users
            )

            if not similar_users:
                return []

            similar_user_ids = [u["user_id"] for u in similar_users]

            # Cache similar users for 6 hours
            cache.set(cache_key, similar_user_ids, 21600)

        # Get products these similar users interacted with (that current user hasn't)
        # ✅ OPTIMIZED: Time window + product IDs only (no joins until needed)
        recent_cutoff = timezone.now() - timedelta(days=90)

        candidate_product_data = (
            Interact.objects.filter(
                user_id__in=similar_user_ids,
                created_at__gte=recent_cutoff,  # Only recent interactions
            )
            .exclude(product_id__in=user_interactions)
            .values("product_id")
            .annotate(
                interaction_count=Count("id"),
                avg_rating=Avg("product__ratings__rating"),
            )
            .filter(product__is_active=True, product__available=True)
            .order_by("-interaction_count", "-avg_rating")[:limit]
        )

        return [
            {
                "product_id": p["product_id"],
                "score": p["interaction_count"],
                "source": "collaborative",
            }
            for p in candidate_product_data
        ]

    @classmethod
    def _content_based_filtering(
        cls, user, user_interactions: Set[int], user_ratings: Dict[int, int], limit: int
    ) -> List[Dict]:
        """
        Content-based filtering using product categories and ratings
        Recommend products from categories the user likes
        """
        if not user_interactions and not user_ratings:
            return []

        # Find categories user has positively interacted with
        # Weight highly-rated products more
        category_scores = defaultdict(float)

        # From ratings (higher weight)
        for product_id, rating in user_ratings.items():
            if rating >= 4:  # Only consider good ratings
                try:
                    product = Product.objects.select_related("category").get(
                        id=product_id
                    )
                    if product.category:
                        category_scores[product.category.id] += rating * 2
                except Product.DoesNotExist:
                    continue

        # From interactions (lower weight)
        interacted_products = Product.objects.filter(
            id__in=user_interactions
        ).select_related("category")

        for product in interacted_products:
            if product.category:
                category_scores[product.category.id] += 1

        if not category_scores:
            return []

        # Get top preferred categories
        top_categories = sorted(
            category_scores.items(), key=lambda x: x[1], reverse=True
        )[:5]
        top_category_ids = [cat_id for cat_id, _ in top_categories]

        # Find highly-rated products from these categories
        # ✅ OPTIMIZED: Added select_related and prefetch_related
        candidate_products = (
            Product.objects.filter(
                category_id__in=top_category_ids, is_active=True, available=True
            )
            .exclude(id__in=user_interactions)
            .select_related("category")  # Join category table
            .prefetch_related("images")  # Prefetch images
            .annotate(avg_rating=Avg("ratings__rating"), rating_count=Count("ratings"))
            .filter(Q(avg_rating__gte=3.5) | Q(rating_count=0))  # Include new products
            .order_by("-avg_rating", "-rating_count")[:limit]
        )

        return [
            {
                "product_id": p.id,
                "score": (p.avg_rating or 3.0) * (1 + min(p.rating_count, 10) / 10),
                "source": "content_based",
            }
            for p in candidate_products
        ]

    @classmethod
    def _get_popular_products(cls, limit: int) -> List[Dict]:
        """Get popular products based on interactions and ratings - OPTIMIZED"""
        # ✅ OPTIMIZED: Added select_related and prefetch_related
        popular = (
            Product.objects.filter(is_active=True, available=True)
            .select_related("category")  # Join category table
            .prefetch_related("images")  # Prefetch images
            .annotate(
                interaction_count=Count("interact"),
                avg_rating=Avg("ratings__rating"),
                rating_count=Count("ratings"),
            )
            .filter(Q(interaction_count__gte=5) | Q(rating_count__gte=3))
            .order_by("-interaction_count", "-avg_rating")[:limit]
        )

        return [
            {
                "product_id": p.id,
                "score": p.interaction_count + (p.avg_rating or 0) * 2,
                "source": "popular",
            }
            for p in popular
        ]

    @classmethod
    def _merge_recommendations(
        cls,
        user,
        collaborative: List[Dict],
        content_based: List[Dict],
        popular: List[Dict],
        user_interactions: Set[int],
        limit: int,
    ) -> List[Product]:
        """
        Merge recommendations from different sources with weighted scoring
        Priority: collaborative > content_based > popular
        """
        scored_products = {}

        # Add collaborative filtering results (highest weight)
        for rec in collaborative:
            product_id = rec["product_id"]
            scored_products[product_id] = (
                scored_products.get(product_id, 0) + rec["score"] * 3
            )

        # Add content-based results (medium weight)
        for rec in content_based:
            product_id = rec["product_id"]
            scored_products[product_id] = (
                scored_products.get(product_id, 0) + rec["score"] * 2
            )

        # Add popular results (lower weight, acts as fallback)
        for rec in popular:
            product_id = rec["product_id"]
            if product_id not in scored_products:  # Only if not already recommended
                scored_products[product_id] = (
                    scored_products.get(product_id, 0) + rec["score"] * 0.5
                )

        # Sort by score and get top products
        sorted_products = sorted(
            scored_products.items(), key=lambda x: x[1], reverse=True
        )
        top_product_ids = [pid for pid, _ in sorted_products[:limit]]

        # Fetch actual product objects maintaining order
        products = Product.objects.filter(
            id__in=top_product_ids, is_active=True, available=True
        )

        # Maintain score-based order
        product_dict = {p.id: p for p in products}
        ordered_products = [
            product_dict[pid] for pid in top_product_ids if pid in product_dict
        ]

        return ordered_products

    @classmethod
    def get_similar_products(cls, product, limit=6) -> List[Product]:
        """Get products similar to a given product - OPTIMIZED"""
        cache_key = f"similar_products_{product.id}_{limit}"
        cached = cache.get(cache_key)
        if cached:
            return cached

        similar = (
            Product.objects.filter(
                category=product.category, is_active=True, available=True
            )
            .exclude(id=product.id)
            .select_related("category")  # ✅ ADD THIS
            .prefetch_related("images")  # ✅ ADD THIS
            .annotate(avg_rating=Avg("ratings__rating"), rating_count=Count("ratings"))
            .order_by("-avg_rating", "-rating_count")[:limit]
        )

        similar_list = list(similar)
        cache.set(cache_key, similar_list, cls.CACHE_TIMEOUT)
        return similar_list

    @classmethod
    def update_user_recommendations(cls, user):
        """
        Pre-compute and store recommendations for a user
        Can be called periodically or triggered after significant interactions

        NOTE: This calls _calculate_recommendations_realtime directly to avoid
        infinite loop with get_user_recommendations
        """
        # Calculate fresh recommendations directly (bypass cache/DB)
        recommendations = cls._calculate_recommendations_realtime(
            user, cls.TOP_K_RECOMMENDATIONS
        )
        product_ids = [p.id for p in recommendations]

        Recommendation.objects.update_or_create(
            user=user, defaults={"product_ids": product_ids}
        )

        # Invalidate cache to force fresh read from DB
        cache_key = f"recommendations_user_{user.id}"
        cache.delete(cache_key)

    @classmethod
    def batch_update_recommendations(cls, user_ids=None):
        """
        Batch update recommendations for multiple users
        Can be run as a periodic task
        """
        from apps.users.models import UserAccount

        if user_ids:
            users = UserAccount.objects.filter(id__in=user_ids)
        else:
            # Update for active users with recent interactions
            users = UserAccount.objects.filter(
                interact__created_at__gte=timezone.now() - timedelta(days=7)
            ).distinct()[:100]

        for user in users:
            cls.update_user_recommendations(user)
