from django.urls import path
from .group_order_views import (
    CreateGroupOrderView,
    JoinGroupOrderView,
    GroupOrderDetailView,
    GroupOrderMembersView,
    GroupOrderItemsView,
    GroupOrderItemDetailView,
    PlaceGroupOrderView,
)

app_name = "group_orders"

urlpatterns = [
    # Create group order
    path("", CreateGroupOrderView.as_view(), name="create_group_order"),
    # Join group order
    path("join/", JoinGroupOrderView.as_view(), name="join_group_order"),
    # Group order detail
    path(
        "<int:group_order_id>/",
        GroupOrderDetailView.as_view(),
        name="group_order_detail",
    ),
    # Group order members
    path(
        "<int:group_order_id>/members/",
        GroupOrderMembersView.as_view(),
        name="group_order_members",
    ),
    # Group order items - combined GET and POST
    path(
        "<int:group_order_id>/items/",
        GroupOrderItemsView.as_view(),
        name="group_order_items",
    ),
    path(
        "<int:group_order_id>/items/<int:item_id>/",
        GroupOrderItemDetailView.as_view(),
        name="group_order_item_detail",
    ),
    # Place group order
    path(
        "<int:group_order_id>/place/",
        PlaceGroupOrderView.as_view(),
        name="place_group_order",
    ),
]
