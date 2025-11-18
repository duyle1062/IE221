from django.db.models import QuerySet, Avg, Q, Count
from django.forms import ValidationError
from rest_framework.generics import ListAPIView, ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, serializers
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from apps.users.permissions import IsAdminUser, IsRegularUser
from rest_framework.exceptions import APIException
from .models import Category, Product, ProductImage, Ratings
from .serializers import (
    ProductSerializer, CategorySerializer, ProductImageSerializer,
    RatingSerializer, AdminProductListSerializer,
    BulkPresignedURLRequestSerializer, BulkConfirmUploadSerializer
)
from .utils import s3_handler
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from django.core.exceptions import ObjectDoesNotExist
from .pagination import StandardResultsSetPagination
from django.shortcuts import get_object_or_404
from django.utils import timezone


# Custom exception for HTTP 410 Gone
class Gone(APIException):
    status_code = status.HTTP_410_GONE
    default_detail = "This resource has been deleted."
    default_code = "gone"

# List all categories / create a new category
class CategoryListView(ListCreateAPIView):
    """
    GET: AllowAny - List all categories
    POST: IsAdminUser - Create new category (ADMIN only)
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["is_active"]
    
    def get_permissions(self):
        if self.request.method == 'POST':
            self.permission_classes = [IsAuthenticated, IsAdminUser]
        else:
            self.permission_classes = [AllowAny]
        return super().get_permissions()


# Retrieve / update / delete the information of categories
class CategoryDetailView(RetrieveUpdateDestroyAPIView):
    """
    GET: AllowAny - Get category details
    PUT/PATCH: IsAdminUser - Update category (ADMIN only)
    DELETE: IsAdminUser - Delete category (ADMIN only)
    """
    lookup_field = "slug_name"
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    
    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            self.permission_classes = [IsAuthenticated, IsAdminUser]
        else:
            self.permission_classes = [AllowAny]
        return super().get_permissions()

    def get_object(self):
        return super().get_object()


# List all products or create a new product
class ProductListView(ListCreateAPIView):
    """
    GET: AllowAny - List products by category
    POST: IsAdminUser - Create new product (ADMIN only)
    """
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["is_active"]
    
    def get_permissions(self):
        if self.request.method == 'POST':
            self.permission_classes = [IsAuthenticated, IsAdminUser]
        else:
            self.permission_classes = [AllowAny]
        return super().get_permissions()

    def get_queryset(self) -> QuerySet[Product]:
        # Only apply category filtering for GET requests (listing products)
        category_name = self.kwargs.get("slug_name", None)
        if category_name is None:
            raise ValidationError("Category name is required")

        if self.request.method == "GET":
            try:
                category = Category.objects.get(slug_name=category_name)
            except ObjectDoesNotExist:
                raise ObjectDoesNotExist("Category does not exist")

            # Annotate with average rating for performance
            # Exclude deleted products (deleted_at IS NULL)
            queryset = Product.objects.filter(
                category=category,
                deleted_at__isnull=True
            ).annotate(
                average_rating=Avg('ratings__rating')
            )
            return queryset
        else:
            return Product.objects.all()


# Retrieve (load) / update / delete the information of a product
class ProductDetailView(RetrieveUpdateDestroyAPIView):
    """
    GET: AllowAny - Get product details with average rating
    PUT/PATCH: IsAdminUser - Update product (ADMIN only)
    DELETE: IsAdminUser - Delete product (ADMIN only)
    """
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend]
    
    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            self.permission_classes = [IsAuthenticated, IsAdminUser]
        else:
            self.permission_classes = [AllowAny]
        return super().get_permissions()

    def get_object(self):
        category_name = self.kwargs.get("slug_name", None)
        product_id = self.kwargs.get("pk", None)

        if category_name is None or product_id is None:
            raise ValidationError("Category name and Product ID are required")

        if self.request.method == "GET":
            try:
                category = Category.objects.get(slug_name=category_name)
            except ObjectDoesNotExist:
                raise ObjectDoesNotExist("Category does not exist")

            try:
                # Annotate with average rating for performance
                product = Product.objects.annotate(
                    average_rating=Avg('ratings__rating')
                ).get(pk=product_id, category=category)

                # Check if product is soft deleted - raise 410 Gone
                if product.deleted_at is not None:
                    raise Gone("This product has been deleted.")

                return product

            except ObjectDoesNotExist:
                raise ObjectDoesNotExist("Product does not exist in this category")

        else:
            product = Product.objects.get(pk=product_id, category__slug_name=category_name)

            # Check if product is soft deleted for UPDATE/DELETE operations - raise 410 Gone
            if product.deleted_at is not None:
                raise Gone("This product has been deleted.")

            return product

    def destroy(self, request, *args, **kwargs):      
        instance = self.get_object()
        
        if instance.deleted_at is not None:
            return Response({"detail": "Product already deleted."}, status=status.HTTP_410_GONE)

        instance.deleted_at = timezone.now()
        instance.save()

        # Return 200 with the deleted product data
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)

# ============== Product Image Management (in Database) ==============

class ProductImageListView(ListAPIView):
    """
    GET: AllowAny - List all images of a product
    POST: IsAdminUser - Add new image URL (ADMIN only)
    """
    serializer_class = ProductImageSerializer
    
    def get_permissions(self):
        if self.request.method == 'POST':
            self.permission_classes = [IsAuthenticated, IsAdminUser]
        else:
            self.permission_classes = [AllowAny]
        return super().get_permissions()

    def get_queryset(self):
        product_id = self.kwargs.get("product_id")
        return ProductImage.objects.filter(product_id=product_id)


class ProductImageDetailView(RetrieveUpdateDestroyAPIView):
    """
    GET: AllowAny - Retrieve image details
    DELETE: IsAdminUser - Delete image (ADMIN only)
    """
    serializer_class = ProductImageSerializer
    lookup_field = "pk"

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            self.permission_classes = [IsAuthenticated, IsAdminUser]
        else:
            self.permission_classes = [AllowAny]
        return super().get_permissions()

    def get_queryset(self):
        product_id = self.kwargs.get("product_id")
        return ProductImage.objects.filter(product_id=product_id)

    def destroy(self, request, *args, **kwargs):
        """Delete image from S3 before deleting from database"""
        instance = self.get_object()

        try:
            s3_key = instance.image_url  # Already the S3 key
            if s3_key:
                s3_handler.delete_product_image(s3_key)
        except Exception as e:
            print(f"Error deleting image from S3: {str(e)}")

        # Delete from database
        return super().destroy(request, *args, **kwargs)



class ProductImageSetPrimaryView(APIView):
    """
    PATCH: IsAdminUser - Set an image as primary for a product (ADMIN only)
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def patch(self, request, product_id, image_id):
        try:
            product = Product.objects.get(pk=product_id)
            image = ProductImage.objects.get(pk=image_id, product=product)
        except ObjectDoesNotExist:
            return Response(
                {"error": "Product or Image does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Remove primary flag from all images of this product
        ProductImage.objects.filter(product=product).update(is_primary=False)

        # Set this image as primary
        image.is_primary = True
        image.save()

        serializer = ProductImageSerializer(image)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ============== S3 Direct Upload ==============

class GetPresignedURLView(APIView):
    """
    POST: IsAdminUser - Get multiple presigned URLs for bulk upload

    Request:
    {
      "files": [
        {"filename": "img1.jpg", "content_type": "image/jpeg"},
        {"filename": "img2.jpg", "content_type": "image/png"}
      ]
    }

    Response:
    {
      "uploads": [
        {"s3_key": "...", "presigned_url": "...", "fields": {...}, "public_url": "..."},
        ...
      ]
    }
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, product_id):
        # Check if product exists
        try:
            Product.objects.get(pk=product_id)
        except ObjectDoesNotExist:
            return Response(
                {"error": "Product does not exist"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Validate request data
        serializer = BulkPresignedURLRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        files = serializer.validated_data['files']
        uploads = []
        errors = []

        for idx, file_data in enumerate(files):
            try:
                # Generate presigned URL for each file
                presigned_data = s3_handler.generate_presigned_upload_url(
                    product_id=product_id,
                    filename=file_data['filename'],
                    content_type=file_data['content_type']
                )

                uploads.append({
                    's3_key': presigned_data['s3_key'],
                    'presigned_url': presigned_data['url'],
                    'fields': presigned_data['fields'],
                    'public_url': presigned_data['public_url']
                })

            except Exception as e:
                errors.append({
                    'index': idx,
                    'filename': file_data['filename'],
                    'error': str(e)
                })

        if errors:
            return Response(
                {
                    'success': len(uploads),
                    'failed': len(errors),
                    'uploads': uploads,
                    'errors': errors
                },
                status=status.HTTP_207_MULTI_STATUS
            )

        return Response({'uploads': uploads}, status=status.HTTP_200_OK)


class ConfirmUploadView(APIView):
    """
    POST: IsAdminUser - Confirm multiple uploads and save to database
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, product_id):
        # Check if product exists
        try:
            product = Product.objects.get(pk=product_id)
        except ObjectDoesNotExist:
            return Response(
                {"error": "Product does not exist"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Validate request data
        serializer = BulkConfirmUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        uploads = serializer.validated_data['uploads']
        created_images = []
        errors = []

        # Count how many images are marked as primary
        primary_count = sum(1 for u in uploads if u.get('is_primary', False))

        # Reject if multiple primaries
        if primary_count > 1:
            return Response(
                {"error": "Only one image can be marked as primary"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # If no primary specified, auto-set first image as primary
        if primary_count == 0 and len(uploads) > 0:
            uploads[0]['is_primary'] = True

        # Get current max sort_order
        current_max_order = ProductImage.objects.filter(product=product).count()

        for idx, upload_data in enumerate(uploads):
            s3_key = upload_data['s3_key']
            is_primary = upload_data.get('is_primary', False)
            sort_order = upload_data.get('sort_order', current_max_order + idx)

            # Verify s3_key belongs to this product
            expected_prefix = f"product/{product_id}/"
            if not s3_key.startswith(expected_prefix):
                errors.append({
                    'index': idx,
                    's3_key': s3_key,
                    'error': 'S3 key does not match product ID'
                })
                continue

            # Verify file exists on S3
            try:
                if not s3_handler.file_exists(s3_key):
                    errors.append({
                        'index': idx,
                        's3_key': s3_key,
                        'error': 'File not found on S3'
                    })
                    continue
            except Exception as e:
                errors.append({
                    'index': idx,
                    's3_key': s3_key,
                    'error': f'Failed to verify file: {str(e)}'
                })
                continue

            # If this is primary, unset other primary images
            if is_primary:
                ProductImage.objects.filter(product=product).update(is_primary=False)

            # Save to database
            try:
                product_image = ProductImage.objects.create(
                    product=product,
                    image_url=s3_key,
                    is_primary=is_primary,
                    sort_order=sort_order
                )
                image_serializer = ProductImageSerializer(product_image)
                created_images.append(image_serializer.data)

            except Exception as e:
                errors.append({
                    'index': idx,
                    's3_key': s3_key,
                    'error': f'Failed to save to database: {str(e)}'
                })

        return Response(
            {
                'success': len(created_images),
                'failed': len(errors),
                'created_images': created_images,
                'errors': errors
            },
            status=status.HTTP_201_CREATED if created_images else status.HTTP_400_BAD_REQUEST
        )


# ============== Product Search ==============


class ProductSearchView(ListCreateAPIView):
    """
    GET: AllowAny - Search products by name across all categories
    """
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["is_active", "category"]

    def get_queryset(self):
        queryset = Product.objects.all()
        search_query = self.request.query_params.get("name", None)

        if search_query:
            # Case-insensitive search for products containing the search term
            queryset = queryset.filter(
                Q(name__icontains=search_query) | Q(description__icontains=search_query)
            )

        # Annotate with average rating
        queryset = queryset.annotate(average_rating=Avg("ratings__rating"))

        return queryset

# ============== Product Rating ==============

class ProductRatingListView(ListCreateAPIView):
    serializer_class = RatingSerializer
    pagination_class = StandardResultsSetPagination
    
    def get_permissions(self):
        if self.request.method == 'POST':
            # Nếu là POST, yêu cầu IsAuthenticated + IsRegularUser
            self.permission_classes = [IsAuthenticated, IsRegularUser]
        else:
            # Nếu là GET, cho phép tất cả
            self.permission_classes = [AllowAny]
        return super().get_permissions()

    def get_queryset(self):
        product_id = self.kwargs.get('product_id')
        # Kiểm tra xem Product có tồn tại không
        product = get_object_or_404(Product, pk=product_id)
        # .select_related('user') sẽ JOIN bảng user vào truy vấn này
        return Ratings.objects.filter(product=product).select_related('user').order_by('-created_at')

    def perform_create(self, serializer):
        product_id = self.kwargs.get('product_id')
        try:
            product = Product.objects.get(pk=product_id)
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product does not exist")

        has_rated = Ratings.objects.filter(
            user=self.request.user,
            product=product
        ).exists()

        if has_rated:
            raise serializers.ValidationError(
                "You have already rated this product"
            )

        serializer.save(user=self.request.user, product=product)

# ============== Admin Views ==============

class AdminProductListCreateView(ListCreateAPIView):
    serializer_class = AdminProductListSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['is_active', 'available', 'category']
    ordering_fields = ['id', 'name', 'price', 'created_at', 'updated_at']
    ordering = ['id']  # Default ordering
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        """
        Get all products including soft-deleted ones.
        Annotate with average rating and total ratings for performance.
        """
        queryset = Product.objects.select_related('category').annotate(
            average_rating=Avg('ratings__rating'),
            total_ratings=Count('ratings')
        ).order_by('-created_at')

        # Optional filter to show only non-deleted products
        include_deleted = self.request.query_params.get('include_deleted', 'true')
        if include_deleted.lower() == 'false':
            queryset = queryset.filter(deleted_at__isnull=True)

        # Optional search by product name
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )

        return queryset

    def perform_create(self, serializer):
        """Handle product creation via admin endpoint"""
        serializer.save()
