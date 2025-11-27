from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from djoser.views import UserViewSet
from IE221.logger import get_logger

logger = get_logger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    POST: Blacklist the refresh token to logout user
    """
    try:
        refresh_token = request.data.get('refresh_token')
        
        if not refresh_token:
            return Response({
                'success': False,
                'message': 'Refresh token is required',
                'error_code': 'REFRESH_TOKEN_REQUIRED'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Blacklist the refresh token
        token = RefreshToken(refresh_token)
        token.blacklist()

        logger.info("User logged out", extra={"user_id": request.user.id})
        return Response({
            'success': True,
            'message': 'Logged out successfully'
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.warning("Logout failed", extra={
            "user_id": request.user.id,
            "error": str(e)
        })
        return Response({
            'success': False,
            'message': 'Logout failed',
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


class CustomUserViewSet(UserViewSet):
    """
    Custom UserViewSet to override permissions for specific actions
    """
    
    def get_permissions(self):
        if self.action == 'reset_password':
            # Allow unauthenticated users to request password reset
            return [AllowAny()]
        return super().get_permissions()
