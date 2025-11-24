"""
Generate sample data for recommendation system testing
Creates interactions and ratings between existing users and products
"""
from django.core.management.base import BaseCommand
from django.db.models import Count
from apps.users.models import UserAccount
from apps.product.models import Product, Interact, Ratings, Category
import random
from datetime import timedelta
from django.utils import timezone


class Command(BaseCommand):
    help = 'Generate sample interactions and ratings for recommendation system'

    def add_arguments(self, parser):
        parser.add_argument(
            '--users',
            type=int,
            default=10,
            help='Number of active users to generate data for'
        )
        parser.add_argument(
            '--interactions-per-user',
            type=int,
            default=15,
            help='Average interactions per user (will vary randomly)'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing sample data before generating'
        )

    def handle(self, *args, **options):
        num_users = options['users']
        avg_interactions = options['interactions_per_user']
        clear_data = options['clear']

        if clear_data:
            self.stdout.write(self.style.WARNING('Clearing existing interactions and ratings...'))
            Interact.objects.all().delete()
            Ratings.objects.filter(comment__startswith='[Sample]').delete()
            self.stdout.write(self.style.SUCCESS('Cleared existing data'))

        # Get users and products
        users = list(UserAccount.objects.filter(is_active=True)[:num_users])
        products = list(Product.objects.filter(is_active=True, available=True))
        categories = list(Category.objects.filter(is_active=True))

        if not users:
            self.stdout.write(self.style.ERROR('No users found. Create users first.'))
            return

        if len(products) < 10:
            self.stdout.write(self.style.ERROR(f'Only {len(products)} products found. Need at least 10.'))
            return

        self.stdout.write(f'Found {len(users)} users and {len(products)} products')

        # Generate diverse user profiles
        user_profiles = self._generate_user_profiles(users, categories)

        total_interactions = 0
        total_ratings = 0

        for user in users:
            profile = user_profiles[user.id]
            
            # Number of interactions for this user (varied)
            num_interactions = random.randint(
                avg_interactions - 5,
                avg_interactions + 10
            )
            
            # Select products based on user profile
            user_products = self._select_products_for_user(
                products, 
                profile, 
                num_interactions
            )

            # Create interactions with timestamps
            interactions_created = self._create_interactions(
                user, 
                user_products
            )
            total_interactions += interactions_created

            # Create ratings (not all interactions get rated)
            ratings_created = self._create_ratings(
                user, 
                user_products, 
                profile
            )
            total_ratings += ratings_created

            self.stdout.write(
                f'User {user.email}: {interactions_created} interactions, {ratings_created} ratings'
            )

        self.stdout.write(
            self.style.SUCCESS(
                f'\n✓ Generated {total_interactions} interactions and {total_ratings} ratings'
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                f'✓ Recommendation system is ready to test!'
            )
        )

    def _generate_user_profiles(self, users, categories):
        """Generate diverse user preference profiles"""
        profiles = {}
        
        for user in users:
            # Each user prefers 1-3 categories
            preferred_categories = random.sample(
                categories, 
                k=min(random.randint(1, 3), len(categories))
            )
            
            # Rating tendency (generous or critical)
            rating_bias = random.uniform(0.5, 1.5)
            
            # Activity level
            activity_level = random.choice(['low', 'medium', 'high'])
            
            profiles[user.id] = {
                'preferred_categories': preferred_categories,
                'rating_bias': rating_bias,
                'activity_level': activity_level
            }
        
        return profiles

    def _select_products_for_user(self, products, profile, num_interactions):
        """Select products based on user preferences"""
        preferred_categories = profile['preferred_categories']
        
        # 70% from preferred categories, 30% random exploration
        num_preferred = int(num_interactions * 0.7)
        num_random = num_interactions - num_preferred
        
        # Get products from preferred categories
        preferred_products = [
            p for p in products 
            if p.category in preferred_categories
        ]
        
        selected = []
        
        # Add preferred category products
        if preferred_products:
            selected.extend(
                random.sample(
                    preferred_products, 
                    k=min(num_preferred, len(preferred_products))
                )
            )
        
        # Add random products for exploration
        remaining = [p for p in products if p not in selected]
        if remaining and num_random > 0:
            selected.extend(
                random.sample(
                    remaining, 
                    k=min(num_random, len(remaining))
                )
            )
        
        return selected

    def _create_interactions(self, user, products):
        """Create interactions with varied timestamps"""
        interactions = []
        now = timezone.now()
        
        for i, product in enumerate(products):
            # Spread interactions over last 30 days
            days_ago = random.randint(0, 30)
            hours_ago = random.randint(0, 23)
            created_at = now - timedelta(days=days_ago, hours=hours_ago)
            
            interaction = Interact(
                user=user,
                product=product,
                created_at=created_at
            )
            interactions.append(interaction)
        
        Interact.objects.bulk_create(interactions, ignore_conflicts=True)
        return len(interactions)

    def _create_ratings(self, user, products, profile):
        """Create ratings for some products"""
        rating_bias = profile['rating_bias']
        
        # Rate 40-60% of interacted products
        num_to_rate = random.randint(
            int(len(products) * 0.4), 
            int(len(products) * 0.6)
        )
        
        products_to_rate = random.sample(products, k=min(num_to_rate, len(products)))
        
        ratings = []
        comments = [
            '[Sample] Rất ngon, sẽ order lại!',
            '[Sample] Tạm ổn, bình thường',
            '[Sample] Không hợp khẩu vị lắm',
            '[Sample] Tuyệt vời!',
            '[Sample] Giá hơi cao nhưng chất lượng ok',
            '[Sample] Giao hàng nhanh, món ăn ngon',
            '[Sample] Sẽ thử lại lần sau',
            '[Sample] Không được như mong đợi',
            '[Sample] Rất hài lòng',
            '[Sample] Bình thường thôi',
        ]
        
        for product in products_to_rate:
            # Base rating from product quality
            base_rating = random.randint(3, 5)
            
            # Adjust by user's rating bias
            adjusted = base_rating * rating_bias
            final_rating = max(1, min(5, int(round(adjusted))))
            
            # High ratings more likely to have comments
            has_comment = random.random() < (final_rating / 5)
            
            rating = Ratings(
                user=user,
                product=product,
                rating=final_rating,
                comment=random.choice(comments) if has_comment else ''
            )
            ratings.append(rating)
        
        Ratings.objects.bulk_create(ratings, ignore_conflicts=True)
        return len(ratings)
