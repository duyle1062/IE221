from django.db.models import QuerySet, Avg
from django.forms import ValidationError
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from .models import Category, Product, ProductImage
from .serializers import ProductSerializer, CategorySerializer, ProductImageSerializer
from django_filters.rest_framework import DjangoFilterBackend
from django.core.exceptions import ObjectDoesNotExist

# List all categories / create a new category
class CategoryListView(ListCreateAPIView):   
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active']
    
# Retrieve / update / delete the information of categories
class CategoryDetailView(RetrieveUpdateDestroyAPIView):
    lookup_field = 'slug_name'
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return super().get_object()


# List all products or create a new product
class ProductListView(ListCreateAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active']
    
    def get_queryset(self) -> QuerySet[Product]:
      # Only apply category filtering for GET requests (listing products)
        category_name = self.kwargs.get('slug_name', None)
        if category_name is None:
            raise ValidationError("Category name is required")

        if self.request.method == 'GET':
            try:
                category = Category.objects.get(slug_name=category_name)
            except ObjectDoesNotExist:
                raise ObjectDoesNotExist("Category does not exist")

            # Annotate with average rating for performance
            queryset = Product.objects.filter(category=category).annotate(
                average_rating=Avg('ratings__rating')
            )
            return queryset
        else:
            return Product.objects.all()


# Retrieve (load) / update / delete the information of a product
class ProductDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]

    def get_object(self):
        category_name = self.kwargs.get('slug_name', None)
        product_id = self.kwargs.get('pk', None)

        if category_name is None or product_id is None:
            raise ValidationError("Category name and Product ID are required")

        if self.request.method == 'GET':
            try:
                category = Category.objects.get(slug_name=category_name)
            except ObjectDoesNotExist:
                raise ObjectDoesNotExist("Category does not exist")

            try:
                # Annotate with average rating for performance
                queryset = Product.objects.annotate(
                    average_rating=Avg('ratings__rating')
                ).get(pk=product_id, category=category)
            except ObjectDoesNotExist:
                raise ObjectDoesNotExist("Product does not exist in this category")

            return queryset
        else:
            return Product.objects.get(pk=product_id, category__slug_name=category_name)


# ============== Product Image Management ==============

class ProductImageListView(ListCreateAPIView):
    """List all images of a product or upload new image"""
    serializer_class = ProductImageSerializer
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        product_id = self.kwargs.get('product_id')
        return ProductImage.objects.filter(product_id=product_id)
    
    def perform_create(self, serializer):
        product_id = self.kwargs.get('product_id')
        try:
            product = Product.objects.get(pk=product_id)
        except ObjectDoesNotExist:
            raise ValidationError("Product does not exist")
        
        # Get the current max sort_order for this product
        max_order = ProductImage.objects.filter(product=product).count()
        
        serializer.save(product=product, sort_order=max_order)


class ProductImageDetailView(RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a specific image"""
    serializer_class = ProductImageSerializer
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]
    lookup_field = 'pk'
    
    def get_queryset(self):
        product_id = self.kwargs.get('product_id')
        return ProductImage.objects.filter(product_id=product_id)


class ProductImageBulkUploadView(APIView):
    """Upload multiple images at once for a product"""
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]
    
    def post(self, request, product_id):
        try:
            product = Product.objects.get(pk=product_id)
        except ObjectDoesNotExist:
            return Response(
                {"error": "Product does not exist"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get multiple files with key 'images'
        files = request.FILES.getlist('images')
        
        if not files:
            return Response(
                {"error": "No images provided. Use 'images' field for multiple files."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        created_images = []
        errors = []
        
        for idx, file in enumerate(files):
            serializer = ProductImageSerializer(data={
                'image_file': file,
                'is_primary': idx == 0,
                'sort_order': idx
            })
            
            if serializer.is_valid():
                serializer.save(product=product)
                created_images.append(serializer.data)
            else:
                errors.append({
                    'index': idx,
                    'filename': file.name,
                    'errors': serializer.errors
                })
        
        return Response({
            'success': len(created_images),
            'failed': len(errors),
            'created_images': created_images,
            'errors': errors
        }, status=status.HTTP_201_CREATED if created_images else status.HTTP_400_BAD_REQUEST)


class ProductImageSetPrimaryView(APIView):
    """Set an image as primary for a product"""
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, product_id, image_id):
        try:
            product = Product.objects.get(pk=product_id)
            image = ProductImage.objects.get(pk=image_id, product=product)
        except ObjectDoesNotExist:
            return Response(
                {"error": "Product or Image does not exist"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Remove primary flag from all images of this product
        ProductImage.objects.filter(product=product).update(is_primary=False)
        
        # Set this image as primary
        image.is_primary = True
        image.save()
        
        serializer = ProductImageSerializer(image)
        return Response(serializer.data, status=status.HTTP_200_OK)