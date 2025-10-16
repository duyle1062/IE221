from django.db import models

class Product(models.Model):
    # Tạm thời làm API cart nên không cần restaurant và category
    # restaurant = models.ForeignKey('Restaurants', models.DO_NOTHING, blank=True, null=True)
    # category = models.ForeignKey('Categories', models.DO_NOTHING, blank=True, null=True)
    name = models.TextField()
    slug = models.TextField()
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image_urls = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(blank=True, null=True)
    available = models.BooleanField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    deleted_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'products'