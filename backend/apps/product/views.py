from django.db.models import QuerySet, Avg
from django.forms import ValidationError
from django.utils import timezone
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import APIException
from .models import Category, Product
from .serializers import ProductSerializer, CategorySerializer
from django_filters.rest_framework import DjangoFilterBackend
from django.core.exceptions import ObjectDoesNotExist


# Custom exception for HTTP 410 Gone
class Gone(APIException):
    status_code = status.HTTP_410_GONE
    default_detail = "This resource has been deleted."
    default_code = "gone"

# List all categories / create a new category
class CategoryListView(ListCreateAPIView):   
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active']
    
# Retrieve / update / delete the information of categories
class CategoryDetailView(RetrieveUpdateDestroyAPIView):
    lookup_field = 'slug_name'
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    
    def get_object(self):
        return super().get_object()


# List all products or create a new product
class ProductListView(ListCreateAPIView):
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active']
    
    def get_queryset(self) -> QuerySet[Product]:
        category_name = self.kwargs.get('slug_name', None)
        if category_name is None:
            raise ValidationError("Category name is required")

        if self.request.method == 'GET':
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
    serializer_class = ProductSerializer
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