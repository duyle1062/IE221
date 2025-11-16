from django.contrib import admin
from .models import Order, OrderItem, Address


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "user",
        "street",
        "ward",
        "province",
        "phone",
        "is_default",
        "is_active",
    ]
    list_filter = ["is_default", "is_active", "province"]
    search_fields = ["street", "ward", "province", "phone", "user__email"]


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ["product", "unit_price", "quantity", "line_total"]


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "user",
        "restaurant_id",
        "type",
        "total",
        "status",
        "payment_status",
        "created_at",
    ]
    list_filter = ["status", "payment_status", "payment_method", "type", "created_at"]
    search_fields = ["user__email", "id"]
    readonly_fields = ["created_at", "updated_at"]
    inlines = [OrderItemInline]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "order",
        "product",
        "unit_price",
        "quantity",
        "line_total",
        "created_at",
    ]
    list_filter = ["created_at"]
    search_fields = ["order__id", "product__name"]
