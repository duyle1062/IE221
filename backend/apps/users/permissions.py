# apps/users/permissions.py
from rest_framework.permissions import BasePermission
from .models import UserAccount

class IsAdminUser(BasePermission):
    """
    Custom permission to only allow admin users to access the view.
    Used for admin-only endpoints like creating/updating/deleting categories, products.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin()


class IsRegularUser(BasePermission):
    """
    Custom permission to only allow regular users (NOT admins) to access the view.
    Used for user-only endpoints like cart, orders, profile.
    Admins should use their dedicated admin endpoints instead.
    """
    def has_permission(self, request, view):
        return (request.user and 
                request.user.is_authenticated and 
                not request.user.is_admin())


class IsOwner(BasePermission):
    """
    Custom permission to only allow owners of an object to access it.
    Used for cart items, orders, and user-specific resources.
    """
    def has_object_permission(self, request, view, obj):
        # Check if the object has a 'user' attribute
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        # For cart items, check through the cart
        if hasattr(obj, 'cart'):
            return obj.cart.user == request.user
        
        return False
    