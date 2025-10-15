from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import UserAccount
from .serializers import UserProfileSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user_info(request):
    try:
        # request.user đã được authenticate qua JWT token
        user = request.user
        
        # Kiểm tra user có tồn tại không
        if not user or not user.is_authenticated:
            return Response({
                'success': False,
                'message': 'User not authenticated',
                'error_code': 'NOT_AUTHENTICATED'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check if user account is active
        if not user.is_active:
            return Response({
                'success': False,
                'message': 'User account has been deactivated',
                'error_code': 'USER_DEACTIVATED'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Check if user is soft deleted (nếu có trường deleted_at)
        if hasattr(user, 'deleted_at') and user.deleted_at:
            return Response({
                'success': False,
                'message': 'User account has been deleted',
                'error_code': 'USER_DELETED'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Serialize user data
        serializer = UserProfileSerializer(user)
        
        return Response({
            'success': True,
            'data': serializer.data,
            'message': 'User information retrieved successfully'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,  
            'message': 'An error occurred while retrieving user information',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    """
    API GET: Lấy thông tin profile của user hiện tại (alias cho get_current_user_info)
    
    Headers cần thiết:
    - Authorization: Bearer <JWT_TOKEN>
    """
    return get_current_user_info(request)
