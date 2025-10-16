# apps/cart/urls.py
from django.urls import path
from .views import (
    CartAPIView, 
    CartItemAddView, 
    CartItemDetailView
)

app_name = 'cart'

urlpatterns = [
    # GET: /api/cart -> Lấy giỏ hàng
    path('', CartAPIView.as_view(), name='cart-detail'),

    # POST: /api/cart/items/ -> Thêm món vào giỏ
    path('/items', CartItemAddView.as_view(), name='add-cart-item'),

    # PATCH, DELETE: /api/cart/items/<pk>/ -> Sửa/Xóa 1 món hàng
    path('/items/<int:pk>', CartItemDetailView.as_view(), name='cart-item-detail'),
]