from django.contrib import admin
from .models import Product, Category, ProductImage, Ratings
from django.utils.html import format_html


class ProductImageInline(admin.TabularInline):
    """Inline admin for product images"""

    model = ProductImage
    extra = 1
    fields = ["image_preview", "image_url", "is_primary", "sort_order"]
    readonly_fields = ["image_preview"]

    def image_preview(self, obj):
        """Display thumbnail in admin"""
        if obj.image_url:
            return format_html(
                '<img src="{}" style="max-height: 100px; max-width: 200px;" />',
                obj.image_url,
            )
        return "No image"

    image_preview.short_description = "Preview"


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "slug_name", "is_active", "sort_order", "created_at"]
    list_filter = ["is_active", "created_at"]
    search_fields = ["name", "slug_name"]
    ordering = ["sort_order", "name"]


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "name",
        "category",
        "price",
        "is_active",
        "available",
        "image_count",
    ]
    list_filter = ["category", "is_active", "available", "created_at"]
    search_fields = ["name", "description"]
    readonly_fields = ["created_at", "updated_at"]
    inlines = [ProductImageInline]

    fieldsets = (
        (
            "Basic Information",
            {"fields": ("name", "slug", "description", "category", "restaurant")},
        ),
        ("Pricing", {"fields": ("price",)}),
        ("Status", {"fields": ("is_active", "available")}),
        (
            "Timestamps",
            {
                "fields": ("created_at", "updated_at", "deleted_at"),
                "classes": ("collapse",),
            },
        ),
    )

    def image_count(self, obj):
        """Display number of images"""
        count = obj.images.count()
        return f"{count} image(s)"

    image_count.short_description = "Images"


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "product",
        "image_preview",
        "is_primary",
        "sort_order",
        "created_at",
    ]
    list_filter = ["is_primary", "created_at"]
    search_fields = ["product__name", "image_url"]
    ordering = ["product", "sort_order"]
    readonly_fields = ["image_preview", "created_at", "updated_at"]

    fieldsets = (
        ("Product", {"fields": ("product",)}),
        (
            "Image Data",
            {"fields": ("image_preview", "image_url")},
        ),
        ("Settings", {"fields": ("is_primary", "sort_order")}),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def image_preview(self, obj):
        """Display image preview"""
        if obj.image_url:
            return format_html(
                '<img src="{}" style="max-height: 300px; max-width: 400px; border: 1px solid #ddd;" />',
                obj.image_url,
            )
        return "No image"

    image_preview.short_description = "Image Preview"


@admin.register(Ratings)
class RatingsAdmin(admin.ModelAdmin):
    list_display = ["id", "product", "user", "rating", "created_at"]
    list_filter = ["rating", "created_at"]
    search_fields = ["product__name", "user__email", "comment"]
    ordering = ["-created_at"]
    readonly_fields = ["created_at", "updated_at"]
