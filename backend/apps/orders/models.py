from django.db import models
from django.conf import settings
from apps.product.models import Product


class OrderStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    PAID = "PAID", "Paid"
    CONFIRMED = "CONFIRMED", "Confirmed"
    PREPARING = "PREPARING", "Preparing"
    READY = "READY", "Ready"
    DELIVERED = "DELIVERED", "Delivered"
    CANCELLED = "CANCELLED", "Cancelled"


class PaymentMethod(models.TextChoices):
    CARD = "CARD", "Card"
    CASH = "CASH", "Cash"
    WALLET = "WALLET", "Wallet"
    THIRD_PARTY = "THIRD_PARTY", "Third Party"


class PaymentStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    SUCCEEDED = "SUCCEEDED", "Succeeded"
    FAILED = "FAILED", "Failed"
    REFUNDED = "REFUNDED", "Refunded"


class Address(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_column="user_id",
        related_name="addresses",
    )
    street = models.TextField()
    ward = models.TextField()
    province = models.TextField()
    phone = models.TextField()
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "addresses"
        verbose_name = "Address"
        verbose_name_plural = "Addresses"

    def __str__(self):
        return f"{self.street}, {self.ward}, {self.province}"


class Order(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_column="user_id",
        related_name="orders",
    )
    restaurant_id = models.IntegerField(default=1)
    address = models.ForeignKey(
        Address,
        on_delete=models.SET_NULL,
        null=True,
        db_column="address_id",
        related_name="orders",
    )
    type = models.CharField(max_length=10, default="DELIVERY")
    group_order_id = models.IntegerField(null=True, blank=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=20, choices=OrderStatus.choices, default=OrderStatus.PAID
    )
    payment_method = models.CharField(
        max_length=20, choices=PaymentMethod.choices, null=True, blank=True
    )
    payment_status = models.CharField(
        max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "orders"
        verbose_name = "Order"
        verbose_name_plural = "Orders"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order #{self.id} - {self.user.email} - {self.status}"


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, db_column="order_id", related_name="items"
    )
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, db_column="product_id"
    )
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.IntegerField()
    line_total = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "order_items"
        verbose_name = "Order Item"
        verbose_name_plural = "Order Items"

    def __str__(self):
        return f"{self.quantity} x {self.product.name} - Order #{self.order.id}"


# ============== Group Order Models ==============


class GroupOrder(models.Model):
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_column="creator_id",
        related_name="created_group_orders",
    )
    restaurant_id = models.IntegerField(default=1)
    code = models.CharField(max_length=50, unique=True)
    status = models.CharField(
        max_length=20, choices=OrderStatus.choices, default=OrderStatus.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "group_orders"
        verbose_name = "Group Order"
        verbose_name_plural = "Group Orders"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Group Order #{self.id} - Code: {self.code}"


class GroupOrderMember(models.Model):
    group_order = models.ForeignKey(
        GroupOrder,
        on_delete=models.CASCADE,
        db_column="group_order_id",
        related_name="members",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_column="user_id",
        related_name="group_order_memberships",
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "group_order_members"
        verbose_name = "Group Order Member"
        verbose_name_plural = "Group Order Members"
        unique_together = ("group_order", "user")

    def __str__(self):
        return f"{self.user.email} in Group Order #{self.group_order.id}"


class GroupOrderItem(models.Model):
    group_order = models.ForeignKey(
        GroupOrder,
        on_delete=models.CASCADE,
        db_column="group_order_id",
        related_name="items",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_column="user_id",
        related_name="group_order_items",
    )
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, db_column="product_id"
    )
    product_name = models.TextField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.IntegerField()
    line_total = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "group_order_items"
        verbose_name = "Group Order Item"
        verbose_name_plural = "Group Order Items"

    def __str__(self):
        return f"{self.quantity} x {self.product_name} by {self.user.email}"
