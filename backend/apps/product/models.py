from django.db import models
from django.db.models import Avg
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.users.models import UserAccount as User

class Product(models.Model):
    # restaurant = models.ForeignKey('Restaurant', on_delete=models.CASCADE, db_column='restaurant_id')
    restaurant = models.IntegerField(db_column='restaurant_id')  # This field type is a guess.
    category = models.ForeignKey('Category', on_delete=models.DO_NOTHING, db_column='category_id', blank=True, null=True)
    name = models.TextField()
    slug = models.TextField()
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.category} - {self.name}"

    def get_average_rating(self):
        # Check if average_rating was already annotated in the queryset
        if hasattr(self, 'average_rating'):
            return self.average_rating
        
        # Fallback: calculate on the fly
        result = Ratings.objects.filter(product=self).aggregate(avg=Avg('rating'))['avg']
        return round(result, 2) if result else None

    class Meta:
        db_table = 'products'
        verbose_name = 'Product'
        verbose_name_plural = 'Products'


class ProductImage(models.Model):
    """Store multiple images for each product as bytea in PostgreSQL"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images', db_column='product_id')
    image_data = models.BinaryField(editable=True)  # Store image as bytea (PNG, JPG, WEBP)
    image_content_type = models.CharField(max_length=50)  # e.g., 'image/png', 'image/jpeg', 'image/webp'
    is_primary = models.BooleanField(default=False)  # Mark primary/thumbnail image
    sort_order = models.IntegerField(default=0)  # For ordering images in gallery
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Image for {self.product.name} ({self.image_content_type})"
    
    class Meta:
        db_table = 'product_images'
        verbose_name = 'Product Image'
        verbose_name_plural = 'Product Images'
        ordering = ['sort_order', 'id']  # Order by sort_order, then by id


class Category(models.Model):
    name = models.TextField()
    slug_name = models.TextField(unique=True)
    description = models.TextField()
    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        db_table = 'categories'
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'
       
        
class Ratings(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, db_column='product_id')
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    review = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Rating {self.rating} for {self.product} by User {self.user}"
    
    class Meta:
        db_table = 'ratings'
        verbose_name = 'Rating'
        verbose_name_plural = 'Ratings'
        unique_together = ('product', 'user')