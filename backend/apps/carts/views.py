# apps/cart/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from apps.users.permissions import IsOwner, IsRegularUser
from .models import Cart, CartItem
from apps.product.models import Product
from .serializers import (
    CartSerializer, 
    AddCartItemSerializer, 
    UpdateCartItemSerializer
)

# GET /api/cart
# Lấy thông tin giỏ hàng của user. Tự động tạo nếu chưa có
class CartAPIView(APIView):
    """
    GET: IsAuthenticated + IsRegularUser - Get user's cart (USER only, NOT admin)
    """
    permission_classes = [IsAuthenticated, IsRegularUser]

    def get(self, request):
        cart, created = Cart.objects.get_or_create(user=request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data, status=status.HTTP_200_OK)

# POST /api/cart/items
# Body: { "product_id": 123, "quantity": 2 }
# Thêm món hàng vào giỏ, có logic cộng dồn
class CartItemAddView(APIView):
    """
    POST: IsAuthenticated + IsRegularUser - Add item to cart (USER only, NOT admin)
    """
    permission_classes = [IsAuthenticated, IsRegularUser]

    def post(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        serializer = AddCartItemSerializer(data=request.data)

        if serializer.is_valid():
            product_id = serializer.validated_data['product_id']
            quantity = serializer.validated_data['quantity']

            item, created = CartItem.objects.get_or_create(
                cart=cart, 
                product_id=product_id,
                defaults={'quantity': quantity} 
            )

            if not created: 
                item.quantity += quantity
                item.save()

            cart_serializer = CartSerializer(cart)
            return Response(cart_serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# PATCH /api/cart/items/{id}
# Body: { "quantity": 3 }
# Cập nhật số lượng của 1 món hàng
class CartItemDetailView(APIView):
    """
    PATCH: IsAuthenticated + IsRegularUser + IsOwner - Update cart item quantity (USER only)
    DELETE: IsAuthenticated + IsRegularUser + IsOwner - Remove item from cart (USER only)
    """
    permission_classes = [IsAuthenticated, IsRegularUser, IsOwner]

    def get_object(self, pk, user):
        try:
            item = CartItem.objects.select_related('cart', 'cart__user').get(
                pk=pk,
                cart__user=user
            )
            # Check object-level permission
            self.check_object_permissions(self.request, item)
            return item
        except CartItem.DoesNotExist:
            return None

    def patch(self, request, pk):
        item = self.get_object(pk, request.user)
        if not item:
            return Response({'message': 'Item not found in your cart.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = UpdateCartItemSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            cart_serializer = CartSerializer(item.cart) # Trả về cả giỏ hàng
            return Response(cart_serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    
    # DELETE /api/cart/items/<pk>/
    # Xóa 1 món hàng khỏi giỏ.
    def delete(self, request, pk):
        item = self.get_object(pk, request.user)
        if not item:
            return Response({'message': 'Item not found in your cart.'}, status=status.HTTP_404_NOT_FOUND)

        cart = item.cart
        item.delete()

        cart_serializer = CartSerializer(cart)
        return Response(cart_serializer.data, status=status.HTTP_200_OK)
    