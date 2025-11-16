from django.urls import path, re_path, include
from . import views
from .views import (
    ProductRatingListView
)

urlpatterns = [
    # Product Search endpoint (must be before category-specific routes)
    path("products/search/", views.ProductSearchView.as_view(), name="product_search"),
    # Category endpoints
    path("category/", views.CategoryListView.as_view(), name="category_list"),
    path(
        "category/<slug:slug_name>/",
        views.CategoryDetailView.as_view(),
        name="category_detail",
    ),
    # Product endpoints
    path(
        "category/<slug:slug_name>/products/",
        views.ProductListView.as_view(),
        name="list_product_by_category",
    ),
    path(
        "category/<slug:slug_name>/products/<int:pk>/",
        views.ProductDetailView.as_view(),
        name="product_detail",
    ),
    # Product Image endpoints
    path(
        "products/<int:product_id>/images/",
        views.ProductImageListView.as_view(),
        name="product_image_list",
    ),
    path(
        "products/<int:product_id>/images/bulk-upload/",
        views.ProductImageBulkUploadView.as_view(),
        name="product_image_bulk_upload",
    ),
    path(
        "products/<int:product_id>/images/<int:pk>/",
        views.ProductImageDetailView.as_view(),
        name="product_image_detail",
    ),
    path(
        "products/<int:product_id>/images/<int:image_id>/set-primary/",
        views.ProductImageSetPrimaryView.as_view(),
        name="product_image_set_primary",
    ),
    # Rating Product
    path(
        "products/<int:product_id>/ratings/",
        views.ProductRatingListView.as_view(),
        name="product_rating_list_create",
    ),
]
