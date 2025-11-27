"""
Test recommendation system quickly
"""
from django.core.management.base import BaseCommand
from django.db.models import Avg
from apps.users.models import UserAccount
from apps.product.models import Product, Interact, Ratings
from apps.product.recommendation_service import RecommendationService


class Command(BaseCommand):
    help = 'Test recommendation system with sample user'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=== Testing Recommendation System ===\n'))

        # Get a user with interactions
        user = UserAccount.objects.filter(
            interact__isnull=False
        ).distinct().first()

        if not user:
            self.stdout.write(self.style.ERROR('No users with interactions found!'))
            self.stdout.write('Run: python manage.py generate_rec_sample_data')
            return

        self.stdout.write(f'Testing with user: {user.email}\n')

        # 1. Check user's data
        interactions = Interact.objects.filter(user=user)
        ratings = Ratings.objects.filter(user=user)
        
        self.stdout.write(f'📊 User Statistics:')
        self.stdout.write(f'  - Total interactions: {interactions.count()}')
        self.stdout.write(f'  - Total ratings: {ratings.count()}')
        
        if interactions.exists():
            recent = interactions.order_by('-created_at')[:3]
            self.stdout.write(f'\n  Recent interactions:')
            for i in recent:
                self.stdout.write(f'    • {i.product.name} ({i.created_at.strftime("%Y-%m-%d %H:%M")})')
        
        if ratings.exists():
            self.stdout.write(f'\n  Ratings:')
            for r in ratings[:3]:
                self.stdout.write(f'    • {r.product.name}: {"⭐" * r.rating} ({r.rating}/5)')

        # 2. Test personalized recommendations
        self.stdout.write(self.style.SUCCESS('\n🎯 Personalized Recommendations:'))
        try:
            recommendations = RecommendationService.get_user_recommendations(user, limit=5)
            if recommendations:
                for idx, product in enumerate(recommendations, 1):
                    avg_rating = product.ratings.aggregate(avg=Avg('rating'))['avg']
                    rating_str = f"{avg_rating:.1f}⭐" if avg_rating else "New"
                    self.stdout.write(f'  {idx}. {product.name} - {rating_str}')
            else:
                self.stdout.write('  No recommendations (need more data)')
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'  Error: {str(e)}'))

        # 3. Test similar products
        if interactions.exists():
            sample_product = interactions.first().product
            self.stdout.write(self.style.SUCCESS(f'\n🔍 Similar to "{sample_product.name}":'))
            try:
                similar = RecommendationService.get_similar_products(sample_product, limit=3)
                if similar:
                    for idx, product in enumerate(similar, 1):
                        self.stdout.write(f'  {idx}. {product.name} (Category: {product.category.name})')
                else:
                    self.stdout.write('  No similar products found')
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  Error: {str(e)}'))

        # 4. Test popular products
        self.stdout.write(self.style.SUCCESS('\n🔥 Popular Products:'))
        try:
            from django.db.models import Count, Avg
            popular = (
                Product.objects
                .filter(is_active=True, available=True)
                .annotate(
                    interaction_count=Count('interact'),
                    avg_rating=Avg('ratings__rating')
                )
                .order_by('-interaction_count', '-avg_rating')[:3]
            )
            if popular:
                for idx, product in enumerate(popular, 1):
                    count = product.interaction_count
                    rating = product.avg_rating or 0
                    self.stdout.write(f'  {idx}. {product.name} - {count} views, {rating:.1f}⭐')
            else:
                self.stdout.write('  No popular products found')
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'  Error: {str(e)}'))

        # 5. Summary
        self.stdout.write(self.style.SUCCESS('\n✅ Test completed!'))
        self.stdout.write('\nNext steps:')
        self.stdout.write('  1. Test API: curl http://localhost:8000/api/recommendations/ -H "Authorization: Bearer YOUR_TOKEN"')
        self.stdout.write('  2. Check Admin: http://localhost:8000/admin/product/interact/')
        self.stdout.write('  3. Generate more data: python manage.py generate_rec_sample_data --users 20')
