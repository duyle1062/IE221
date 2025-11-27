from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db import transaction

from .models import GroupOrder, GroupOrderMember, GroupOrderItem


class RemoveMemberView(APIView):
    """
    DELETE /api/group-orders/<id>/members/<member_id>/
    Remove a member from group order (creator only)
    - Deletes member and all their items
    """

    permission_classes = [IsAuthenticated]

    def delete(self, request, group_order_id, member_id):
        try:
            group_order = GroupOrder.objects.get(id=group_order_id)
        except GroupOrder.DoesNotExist:
            return Response(
                {"error": "Group order not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Check if user is the creator
        if group_order.creator_id != request.user.id:
            return Response(
                {"error": "Only the group creator can remove members"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check if group order is still pending
        if group_order.status != "PENDING":
            return Response(
                {"error": "Cannot remove members from a finalized group order"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the member to remove
        try:
            member = GroupOrderMember.objects.select_related("user").get(
                id=member_id, group_order=group_order
            )
        except GroupOrderMember.DoesNotExist:
            return Response(
                {"error": "Member not found in this group order"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Cannot remove the creator
        if member.user.id == group_order.creator_id:
            return Response(
                {"error": "Cannot remove the group creator"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            # Delete all items added by this member
            deleted_items_count = GroupOrderItem.objects.filter(
                group_order=group_order, user=member.user
            ).delete()[0]

            # Remove member from group
            member_email = member.user.email
            member.delete()

            return Response(
                {
                    "message": f"Successfully removed {member_email} from the group",
                    "deleted_items_count": deleted_items_count,
                },
                status=status.HTTP_200_OK,
            )
