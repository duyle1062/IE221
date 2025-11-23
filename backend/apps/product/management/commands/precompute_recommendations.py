"""
Management command to pre-compute recommendations for all users
Usage: python manage.py precompute_recommendations [--user_id USER_ID]
"""

from django.core.management.base import BaseCommand
from apps.users.models import UserAccount
from apps.product.recommendation_service import RecommendationService


class Command(BaseCommand):
    help = "Pre-compute recommendations for users to populate the recommendation table"

    def add_arguments(self, parser):
        parser.add_argument(
            "--user_id",
            type=int,
            help="Specific user ID to compute recommendations for",
        )
        parser.add_argument(
            "--all",
            action="store_true",
            help="Compute for all active users",
        )

    def handle(self, *args, **options):
        user_id = options.get("user_id")
        compute_all = options.get("all")

        if user_id:
            # Compute for specific user
            try:
                user = UserAccount.objects.get(id=user_id)
                self.stdout.write(
                    f"Computing recommendations for user {user.id} ({user.email})..."
                )

                RecommendationService.update_user_recommendations(user)

                self.stdout.write(
                    self.style.SUCCESS(
                        f"✅ Successfully computed recommendations for user {user.id}"
                    )
                )
            except UserAccount.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"❌ User {user_id} not found"))

        elif compute_all:
            # Compute for all active users
            users = UserAccount.objects.filter(is_active=True)
            total = users.count()

            self.stdout.write(f"Computing recommendations for {total} active users...")

            success_count = 0
            error_count = 0

            for idx, user in enumerate(users, 1):
                try:
                    self.stdout.write(f"[{idx}/{total}] Processing user {user.id}...")
                    RecommendationService.update_user_recommendations(user)
                    success_count += 1
                except Exception as e:
                    self.stdout.write(
                        self.style.WARNING(f"⚠️ Failed for user {user.id}: {str(e)}")
                    )
                    error_count += 1

            self.stdout.write(
                self.style.SUCCESS(
                    f"\n✅ Completed: {success_count} success, {error_count} errors"
                )
            )
        else:
            self.stdout.write(
                self.style.ERROR("Please specify --user_id USER_ID or --all")
            )
