"""
Product App Configuration
"""

from django.apps import AppConfig


class ProductConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.product'
    verbose_name = 'Product Management'

    def ready(self):
        """Import signals when app is ready"""
        import apps.product.signals  # noqa: F401
