"""
Signals for Product App
Handles automatic cache invalidation when products are soft-deleted
"""

import logging
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.core.cache import cache
from .models import Product, Recommendation

logger = logging.getLogger(__name__)


@receiver(pre_save, sender=Product)
def invalidate_recommendations_on_product_delete(sender, instance, **kwargs):
    """
    When a product is soft-deleted (deleted_at is set),
    invalidate all recommendation caches and stored recommendations
    containing that product.
    
    This ensures users don't see deleted products in recommendations.
    """
    # Check if this is an update (not a new product)
    if instance.pk:
        try:
            # Get old instance from DB
            old_instance = Product.objects.get(pk=instance.pk)
            
            # Check if product is being soft-deleted (deleted_at changed from None to a value)
            if old_instance.deleted_at is None and instance.deleted_at is not None:
                logger.info(
                    f"Product {instance.id} ({instance.name}) is being soft-deleted. "
                    "Invalidating related recommendations..."
                )
                
                # Find all recommendations containing this product
                recommendations = Recommendation.objects.filter(
                    product_ids__contains=[instance.id]
                )
                
                affected_users = []
                for rec in recommendations:
                    # Remove deleted product from stored recommendations
                    if instance.id in rec.product_ids:
                        rec.product_ids.remove(instance.id)
                        rec.save()
                        affected_users.append(rec.user.id)
                        
                        # Invalidate user's cache
                        cache_key = f"recommendations_user_{rec.user.id}"
                        cache.delete(cache_key)
                
                if affected_users:
                    logger.info(
                        f"Invalidated recommendations for {len(affected_users)} users: {affected_users}"
                    )
                else:
                    logger.info("No users affected by product deletion")
                    
        except Product.DoesNotExist:
            # New product, no need to invalidate
            pass
