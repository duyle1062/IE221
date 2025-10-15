from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password

from apps.users.models import User
from apps.users.serializers import UserProfileSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    API Login để lấy token
    
    Body:
    {
        "email": "user@example.com",
        "password": "password"
    }
    
    Response:
    {
        "success": true,
        "data": {
            "token": "abc123...",
            "user": { user_profile_data }
        },
        "message": "Login successful"
    }
    """
    try:
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response({
                'success': False,
                'message': 'Email and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Authenticate user
        user = authenticate(request, username=email, password=password)
        
        if user is not None:
            if user.deleted_at:
                return Response({
                    'success': False,
                    'message': 'Account has been deactivated'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Get or create token
            token, created = Token.objects.get_or_create(user=user)
            
            # Serialize user data
            user_serializer = UserProfileSerializer(user)
            
            return Response({
                'success': True,
                'data': {
                    'token': token.key,
                    'user': user_serializer.data
                },
                'message': 'Login successful'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'message': 'Invalid email or password'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
    except Exception as e:
        return Response({
            'success': False,
            'message': 'An error occurred during login',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    API Register user mới (để test)
    
    Body:
    {
        "email": "newuser@example.com",
        "password": "password123",
        "firstname": "John",
        "lastname": "Doe",
        "gender": "male",
        "phone": "0123456789"
    }
    """
    try:
        email = request.data.get('email')
        password = request.data.get('password')
        firstname = request.data.get('firstname')
        lastname = request.data.get('lastname')
        
        if not all([email, password, firstname, lastname]):
            return Response({
                'success': False,
                'message': 'Email, password, firstname, and lastname are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user exists
        if User.objects.filter(email=email).exists():
            return Response({
                'success': False,
                'message': 'User with this email already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create user
        user = User.objects.create(
            email=email,
            password=make_password(password),
            firstname=firstname,
            lastname=lastname,
            gender=request.data.get('gender'),
            phone=request.data.get('phone')
        )
        
        # Create token
        token = Token.objects.create(user=user)
        
        # Serialize user data
        user_serializer = UserProfileSerializer(user)
        
        return Response({
            'success': True,
            'data': {
                'token': token.key,
                'user': user_serializer.data
            },
            'message': 'User registered successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': 'An error occurred during registration',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
