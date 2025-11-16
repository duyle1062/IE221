from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """
    Permission class to check if user has ADMIN role
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "ADMIN"
        )
