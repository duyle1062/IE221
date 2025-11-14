# apps/users/permissions.py
from rest_framework.permissions import BasePermission
from .models import UserAccount

class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin()