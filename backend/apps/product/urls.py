from django.urls import path, re_path, include
from . import views

urlpatterns = [
    path("category/", views.CategoryListView.as_view(), name="category_detail"),
    path("category/<slug:slug_name>/products/", views.ProductListView.as_view(), name="list_product_by_category"),

    path("category/<slug:slug_name>/", views.CategoryDetailView.as_view(), name="category_detail"),
    path("category/<slug:slug_name>/products/<int:pk>/", views.ProductDetailView.as_view(), name="product_detail"),
]