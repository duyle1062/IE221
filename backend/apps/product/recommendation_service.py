"""
Recommendation Service for IE221 Food Ordering Platform
Combines collaborative filtering based on user interactions and ratings
with content-based filtering using product categories
"""
from django.db.models import Count, Avg, Q, F
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
from collections import defaultdict, Counter
import random
from typing import List, Dict, Set
from .models import Product, Interact, Recommendation, Ratings, Category


class RecommendationService:
    """Service for generating personalized product recommendations"""
    
    CACHE_TIMEOUT = 3600  # 1 hour
    TOP_K_RECOMMENDATIONS = 10
    MIN_INTERACTIONS_FOR_COLLABORATIVE = 3
    
    @classmethod
    def track_interaction(cls, user, product):
        """Track user interaction with a product (view/click)"""
        Interact.objects.create(user=user, product=product)
        # Invalidate user's recommendation cache
        cache_key = f"recommendations_user_{user.id}"
        cache.delete(cache_key)
    
    @classmethod
    def get_user_recommendations(cls, user, limit=10) -> List[Product]:
        """
        Get personalized recommendations for a user
        Uses hybrid approach: collaborative + content-based + popularity
        """
        cache_key = f"recommendations_user_{user.id}"
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        # Get user's interaction history
        user_interactions = cls._get_user_interaction_history(user)
        user_ratings = cls._get_user_ratings(user)
        
        # Combine different recommendation strategies
        collaborative_recs = cls._collaborative_filtering(user, user_interactions, limit * 2)
        content_based_recs = cls._content_based_filtering(user, user_interactions, user_ratings, limit * 2)
        popular_recs = cls._get_popular_products(limit)
        
        # Merge and rank recommendations
        final_recommendations = cls._merge_recommendations(
            user,
            collaborative_recs,
            content_based_recs,
            popular_recs,
            user_interactions,
            limit
        )
        
        cache.set(cache_key, final_recommendations, cls.CACHE_TIMEOUT)
        return final_recommendations
    
    @classmethod
    def _get_user_interaction_history(cls, user) -> Set[int]:
        """Get set of product IDs user has interacted with"""
        return set(
            Interact.objects.filter(user=user)
            .values_list('product_id', flat=True)
        )
    
    @classmethod
    def _get_user_ratings(cls, user) -> Dict[int, int]:
        """Get user's product ratings"""
        return dict(
            Ratings.objects.filter(user=user)
            .values_list('product_id', 'rating')
        )
    
    @classmethod
    def _collaborative_filtering(cls, user, user_interactions: Set[int], limit: int) -> List[Dict]:
        """
        Collaborative filtering based on similar users' interactions
        Find users who interacted with similar products and recommend what they liked
        """
        if len(user_interactions) < cls.MIN_INTERACTIONS_FOR_COLLABORATIVE:
            return []
        
        # Find similar users based on common interactions
        similar_users = (
            Interact.objects
            .filter(product_id__in=user_interactions)
            .exclude(user=user)
            .values('user_id')
            .annotate(common_count=Count('id'))
            .order_by('-common_count')[:20]
        )
        
        if not similar_users:
            return []
        
        similar_user_ids = [u['user_id'] for u in similar_users]
        
        # Get products these similar users interacted with (that current user hasn't)
        candidate_products = (
            Interact.objects
            .filter(user_id__in=similar_user_ids)
            .exclude(product_id__in=user_interactions)
            .values('product_id')
            .annotate(
                interaction_count=Count('id'),
                avg_rating=Avg('product__ratings__rating')
            )
            .filter(product__is_active=True, product__available=True)
            .order_by('-interaction_count', '-avg_rating')[:limit]
        )
        
        return [
            {
                'product_id': p['product_id'],
                'score': p['interaction_count'],
                'source': 'collaborative'
            }
            for p in candidate_products
        ]
    
    @classmethod
    def _content_based_filtering(cls, user, user_interactions: Set[int], 
                                 user_ratings: Dict[int, int], limit: int) -> List[Dict]:
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
                    product = Product.objects.select_related('category').get(id=product_id)
                    if product.category:
                        category_scores[product.category.id] += rating * 2
                except Product.DoesNotExist:
                    continue
        
        # From interactions (lower weight)
        interacted_products = Product.objects.filter(
            id__in=user_interactions
        ).select_related('category')
        
        for product in interacted_products:
            if product.category:
                category_scores[product.category.id] += 1
        
        if not category_scores:
            return []
        
        # Get top preferred categories
        top_categories = sorted(category_scores.items(), key=lambda x: x[1], reverse=True)[:5]
        top_category_ids = [cat_id for cat_id, _ in top_categories]
        
        # Find highly-rated products from these categories
        candidate_products = (
            Product.objects
            .filter(
                category_id__in=top_category_ids,
                is_active=True,
                available=True
            )
            .exclude(id__in=user_interactions)
            .annotate(
                avg_rating=Avg('ratings__rating'),
                rating_count=Count('ratings')
            )
            .filter(
                Q(avg_rating__gte=3.5) | Q(rating_count=0)  # Include new products
            )
            .order_by('-avg_rating', '-rating_count')[:limit]
        )
        
        return [
            {
                'product_id': p.id,
                'score': (p.avg_rating or 3.0) * (1 + min(p.rating_count, 10) / 10),
                'source': 'content_based'
            }
            for p in candidate_products
        ]
    
    @classmethod
    def _get_popular_products(cls, limit: int) -> List[Dict]:
        """Get popular products based on interactions and ratings"""
        popular = (
            Product.objects
            .filter(is_active=True, available=True)
            .annotate(
                interaction_count=Count('interact'),
                avg_rating=Avg('ratings__rating'),
                rating_count=Count('ratings')
            )
            .filter(
                Q(interaction_count__gte=5) | Q(rating_count__gte=3)
            )
            .order_by('-interaction_count', '-avg_rating')[:limit]
        )
        
        return [
            {
                'product_id': p.id,
                'score': p.interaction_count + (p.avg_rating or 0) * 2,
                'source': 'popular'
            }
            for p in popular
        ]
    
    @classmethod
    def _merge_recommendations(cls, user, collaborative: List[Dict], 
                               content_based: List[Dict], popular: List[Dict],
                               user_interactions: Set[int], limit: int) -> List[Product]:
        """
        Merge recommendations from different sources with weighted scoring
        Priority: collaborative > content_based > popular
        """
        scored_products = {}
        
        # Add collaborative filtering results (highest weight)
        for rec in collaborative:
            product_id = rec['product_id']
            scored_products[product_id] = scored_products.get(product_id, 0) + rec['score'] * 3
        
        # Add content-based results (medium weight)
        for rec in content_based:
            product_id = rec['product_id']
            scored_products[product_id] = scored_products.get(product_id, 0) + rec['score'] * 2
        
        # Add popular results (lower weight, acts as fallback)
        for rec in popular:
            product_id = rec['product_id']
            if product_id not in scored_products:  # Only if not already recommended
                scored_products[product_id] = scored_products.get(product_id, 0) + rec['score'] * 0.5
        
        # Sort by score and get top products
        sorted_products = sorted(scored_products.items(), key=lambda x: x[1], reverse=True)
        top_product_ids = [pid for pid, _ in sorted_products[:limit]]
        
        # Fetch actual product objects maintaining order
        products = Product.objects.filter(
            id__in=top_product_ids,
            is_active=True,
            available=True
        )
        
        # Maintain score-based order
        product_dict = {p.id: p for p in products}
        ordered_products = [product_dict[pid] for pid in top_product_ids if pid in product_dict]
        
        return ordered_products
    
    @classmethod
    def get_similar_products(cls, product, limit=6) -> List[Product]:
        """
        Get products similar to a given product based on category and ratings
        Useful for "You may also like" sections
        """
        cache_key = f"similar_products_{product.id}_{limit}"
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        similar = (
            Product.objects
            .filter(
                category=product.category,
                is_active=True,
                available=True
            )
            .exclude(id=product.id)
            .annotate(
                avg_rating=Avg('ratings__rating'),
                rating_count=Count('ratings')
            )
            .order_by('-avg_rating', '-rating_count')[:limit]
        )
        
        similar_list = list(similar)
        cache.set(cache_key, similar_list, cls.CACHE_TIMEOUT)
        return similar_list
    
    @classmethod
    def update_user_recommendations(cls, user):
        """
        Pre-compute and store recommendations for a user
        Can be called periodically or triggered after significant interactions
        """
        recommendations = cls.get_user_recommendations(user, cls.TOP_K_RECOMMENDATIONS)
        product_ids = [p.id for p in recommendations]
        
        Recommendation.objects.update_or_create(
            user=user,
            defaults={'product_ids': product_ids}
        )
    
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
