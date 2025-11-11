# apps/cart/urls.py
from django.urls import path
from .views import (
    CartAPIView, 
    CartItemAddView, 
    CartItemDetailView
)

app_name = 'cart'

urlpatterns = [
    # GET: /api/cart/ -> Lấy giỏ hàng (Django sẽ auto redirect /api/cart -> /api/cart/)
    path('', CartAPIView.as_view(), name='cart-detail'),

    # POST: /api/cart/items/
    path('items/', CartItemAddView.as_view(), name='add-cart-item'),

    # PATCH, DELETE: /api/cart/items/<pk>/
    path('items/<int:pk>/', CartItemDetailView.as_view(), name='cart-item-detail'),
]