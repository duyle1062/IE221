from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db import transaction

from .models import GroupOrder, GroupOrderMember, GroupOrderItem


class LeaveGroupOrderView(APIView):
    """
    POST /api/group-orders/<id>/leave/
    Leave a group order
    - If creator leaves: Cancel the entire group order (status -> CANCELLED)
    - If member leaves: Remove member and delete all their items
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, group_order_id):
        try:
            group_order = GroupOrder.objects.get(id=group_order_id)
        except GroupOrder.DoesNotExist:
            return Response(
                {"error": "Group order not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Check if group order is still pending
        if group_order.status != "PENDING":
            return Response(
                {
                    "error": "Cannot leave a group order that has been placed or cancelled"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if user is a member
        try:
            member = GroupOrderMember.objects.get(
                group_order=group_order, user=request.user
            )
        except GroupOrderMember.DoesNotExist:
            return Response(
                {"error": "You are not a member of this group order"},
                status=status.HTTP_403_FORBIDDEN,
            )

        is_creator = group_order.creator_id == request.user.id

        with transaction.atomic():
            if is_creator:
                # Creator leaves: Cancel the entire group order
                group_order.status = "CANCELLED"
                group_order.save()

                return Response(
                    {
                        "message": "Group order cancelled. All members have been notified.",
                        "cancelled": True,
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                # Member leaves: Delete their items and membership
                # Delete all items added by this user
                deleted_items_count = GroupOrderItem.objects.filter(
                    group_order=group_order, user=request.user
                ).delete()[0]

                # Remove member from group
                member.delete()

                # Verify deletion
                still_member = GroupOrderMember.objects.filter(
                    group_order=group_order, user=request.user
                ).exists()

                if still_member:
                    # This should never happen
                    return Response(
                        {"error": "Failed to remove member from group"},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    )

                return Response(
                    {
                        "message": "Successfully left the group order",
                        "deleted_items_count": deleted_items_count,
                        "cancelled": False,
                    },
                    status=status.HTTP_200_OK,
                )
