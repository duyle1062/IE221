from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.utils import timezone

from apps.orders.models import Address
from apps.users.permissions import IsRegularUser
from .serializers import AddressSerializer


class AddressListCreateView(APIView):
    """
    GET /api/addresses/ - List all addresses for authenticated user
    POST /api/addresses/ - Create new address for authenticated user
    """

    permission_classes = [IsAuthenticated, IsRegularUser]

    def get(self, request):
        """
        List all active addresses for the authenticated user
        """
        addresses = Address.objects.filter(
            user=request.user, 
            is_active=True
        ).order_by('-is_default', '-created_at')
        
        serializer = AddressSerializer(addresses, many=True)
        return Response({
            "success": True,
            "data": serializer.data,
            "count": addresses.count()
        }, status=status.HTTP_200_OK)

    def post(self, request):
        """
        Create a new address for the authenticated user
        """
        serializer = AddressSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response({
                "success": True,
                "message": "Address created successfully",
                "data": serializer.data
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            "success": False,
            "message": "Failed to create address",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class AddressDetailView(APIView):
    """
    GET /api/addresses/<id>/ - Get address details
    PUT /api/addresses/<id>/ - Update address (full update)
    PATCH /api/addresses/<id>/ - Update address (partial update)
    DELETE /api/addresses/<id>/ - Delete address (soft delete)
    """

    permission_classes = [IsAuthenticated, IsRegularUser]

    def get_object(self, address_id, user):
        """
        Get address object if it belongs to the user and is active
        """
        try:
            return Address.objects.get(
                id=address_id, 
                user=user, 
                is_active=True
            )
        except Address.DoesNotExist:
            return None

    def get(self, request, address_id):
        """
        Get address details
        """
        address = self.get_object(address_id, request.user)
        
        if not address:
            return Response({
                "success": False,
                "message": "Address not found"
            }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = AddressSerializer(address)
        return Response({
            "success": True,
            "data": serializer.data
        }, status=status.HTTP_200_OK)

    def put(self, request, address_id):
        """
        Full update of address
        """
        address = self.get_object(address_id, request.user)
        
        if not address:
            return Response({
                "success": False,
                "message": "Address not found"
            }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = AddressSerializer(address, data=request.data)
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "message": "Address updated successfully",
                "data": serializer.data
            }, status=status.HTTP_200_OK)
        
        return Response({
            "success": False,
            "message": "Failed to update address",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, address_id):
        """
        Partial update of address
        """
        address = self.get_object(address_id, request.user)
        
        if not address:
            return Response({
                "success": False,
                "message": "Address not found"
            }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = AddressSerializer(address, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "message": "Address updated successfully",
                "data": serializer.data
            }, status=status.HTTP_200_OK)
        
        return Response({
            "success": False,
            "message": "Failed to update address",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, address_id):
        """
        Soft delete address
        """
        address = self.get_object(address_id, request.user)
        
        if not address:
            return Response({
                "success": False,
                "message": "Address not found"
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Prevent deletion if it's the default address and there are other addresses
        if address.is_default:
            other_addresses = Address.objects.filter(
                user=request.user,
                is_active=True
            ).exclude(id=address_id)
            
            if other_addresses.exists():
                return Response({
                    "success": False,
                    "message": "Cannot delete default address. Please set another address as default first."
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Soft delete
        address.is_active = False
        address.deleted_at = timezone.now()
        address.save(update_fields=['is_active', 'deleted_at'])
        
        return Response({
            "success": True,
            "message": "Address deleted successfully"
        }, status=status.HTTP_200_OK)


class SetDefaultAddressView(APIView):
    """
    POST /api/addresses/<id>/set-default/ - Set address as default
    """

    permission_classes = [IsAuthenticated, IsRegularUser]

    def post(self, request, address_id):
        """
        Set address as default
        """
        try:
            address = Address.objects.get(
                id=address_id,
                user=request.user,
                is_active=True
            )
        except Address.DoesNotExist:
            return Response({
                "success": False,
                "message": "Address not found"
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Unset all other default addresses
        Address.objects.filter(
            user=request.user,
            is_active=True
        ).exclude(id=address_id).update(is_default=False)
        
        # Set this address as default
        address.is_default = True
        address.save(update_fields=['is_default'])
        
        serializer = AddressSerializer(address)
        return Response({
            "success": True,
            "message": "Default address updated successfully",
            "data": serializer.data
        }, status=status.HTTP_200_OK)
