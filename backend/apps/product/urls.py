from django.urls import path, re_path, include
from . import views
from .views import (
    ProductRatingListView
)

urlpatterns = [
    # Admin endpoints
    path("admin/products/", views.AdminProductListCreateView.as_view(), name="admin_product_list"),
    
    # Product Search endpoint (must be before category-specific routes)
    path("products/search/", views.ProductSearchView.as_view(), name="product_search"),
    
    # Category endpoints
    path("category/", views.CategoryListView.as_view(), name="category_list"),
    path("category/<slug:slug_name>/", views.CategoryDetailView.as_view(), name="category_detail"),
    
    
    # Product endpoints
    # 1. List (Create) products by category
    path("category/<slug:slug_name>/products/", views.ProductListView.as_view(), name="list_product_by_category"),
    # 2. Retrieve (load) / update / delete the information of a product - accepts both slug and ID
    path("category/<slug:slug_name>/products/<slug:pk>/", views.ProductDetailView.as_view(), name="product_detail"),
    
    
    # Product Image endpoints
    path("products/<int:product_id>/images/", views.ProductImageListView.as_view(), name="product_image_list"),

    # S3 Direct Upload endpoints
    path("products/<int:product_id>/images/presigned-url/", views.GetPresignedURLView.as_view(), name="product_image_presigned_url"),

    path("products/<int:product_id>/images/confirm-upload/", views.ConfirmUploadView.as_view(), name="product_image_confirm_upload"),

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
