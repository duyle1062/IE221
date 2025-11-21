# 🚀 Recommendation System - Complete Guide

## 📋 Mục Lục

1. [Overview & Architecture](#overview--architecture)
2. [Quick Start Guide](#quick-start-guide)
3. [Recommendation Strategies](#recommendation-strategies)
4. [Data Flow & Tables](#data-flow--tables)
5. [API Endpoints](#api-endpoints)
6. [Pre-computed Recommendations](#pre-computed-recommendations)
7. [Frontend Integration](#frontend-integration)
8. [Production Setup](#production-setup)
9. [Best Practices](#best-practices)

---

## 🎯 Overview & Architecture

Hệ thống recommendation cho IE221 Food Ordering Platform, kết hợp nhiều chiến lược để đưa ra gợi ý sản phẩm cá nhân hóa.

### Core Models

#### 1. **Interact** - Lịch sử tương tác user-product

```python
class Interact(models.Model):
    user = ForeignKey(User)
    product = ForeignKey(Product)
    created_at = DateTimeField(auto_now_add=True)
```

#### 2. **Ratings** - Đánh giá sản phẩm

```python
class Ratings(models.Model):
    user = ForeignKey(User)
    product = ForeignKey(Product)
    rating = IntegerField(1-5)
    comment = TextField(optional)
    created_at = DateTimeField(auto_now_add=True)
```

#### 3. **Recommendation** - Lưu trữ recommendations đã tính trước

```python
class Recommendation(models.Model):
    user = OneToOneField(User)
    product_ids = JSONField()  # [1, 5, 8, 12, ...]
    updated_at = DateTimeField(auto_now=True)
```

---

## ⚡ Quick Start Guide

### Bước 1: Migration (Đã xong)

```bash
python manage.py migrate
```

### Bước 2: Tạo Dữ Liệu Mẫu

#### Cơ bản (10 users, ~15 interactions mỗi user):

```bash
python manage.py generate_rec_sample_data
```

#### Tùy chỉnh số lượng:

```bash
# 20 users với trung bình 20 interactions/user
python manage.py generate_rec_sample_data --users 20 --interactions-per-user 20
```

#### Xóa và tạo lại:

```bash
python manage.py generate_rec_sample_data --clear
```

### Bước 3: Kiểm Tra Dữ Liệu

#### Qua Admin API:

**1. Login để lấy admin token:**

```bash
curl -X POST http://localhost:8000/auth/login/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin_password"}'
```

**2. Xem Statistics:**

```bash
curl http://localhost:8000/api/admin/recommendations/statistics/ \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**3. Xem All Interactions:**

```bash
curl "http://localhost:8000/api/admin/recommendations/interactions/?page=1&page_size=20" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Bước 4: Test API Endpoints

#### 1. Lấy Popular Products (Không cần auth):

```bash
curl http://localhost:8000/api/products/popular/?limit=5
```

#### 2. Login và lấy token:

```bash
curl -X POST http://localhost:8000/auth/login/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"yourpassword"}'
```

#### 3. Lấy Personalized Recommendations:

```bash
curl http://localhost:8000/api/recommendations/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 4. Lấy Similar Products:

```bash
curl http://localhost:8000/api/recommendations/similar/1/?limit=5
```

#### 5. Track Interaction:

```bash
curl -X POST http://localhost:8000/api/recommendations/track_interaction/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"product_id": 1}'
```

---

## 🧠 Recommendation Strategies

### 1. **Collaborative Filtering** (Weight: 3x)

**Dựa trên**: "Users giống bạn cũng thích..."

**Thuật toán**:

```python
# Bước 1: Lấy products user hiện tại đã xem
user_products = Interact.objects.filter(user=current_user).values_list('product_id', flat=True)

# Bước 2: Tìm similar users (users cũng xem những products đó)
similar_users = Interact.objects.filter(
    product__in=user_products
).exclude(user=current_user).values('user').annotate(
    common_count=Count('id')
).filter(common_count__gte=3)  # Tối thiểu 3 products chung

# Bước 3: Lấy products mà similar users rated cao
recommendations = Ratings.objects.filter(
    user__in=similar_users,
    rating__gte=4  # Chỉ lấy ratings 4-5 sao
).exclude(product__in=user_products)
```

**Parameters**:

- `min_common_products=3` - Tối thiểu 3 products chung để coi là similar user
- `min_rating=4` - Chỉ recommend products được rate ≥4
- `weight=3` - Độ ưu tiên cao nhất

**Ví dụ**:

- User A xem: Phở Bò, Bánh Mì, Cơm Tấm
- User B xem: Phở Bò, Bánh Mì, Cơm Tấm, Bún Bò (rated 5⭐)
  → Recommend cho User A: Bún Bò

---

### 2. **Content-Based Filtering** (Weight: 2x)

**Dựa trên**: "Bạn thích category X nên sẽ thích products khác trong category đó"

**Thuật toán**:

```python
# Bước 1: Phân tích category preferences
user_ratings = Ratings.objects.filter(user=current_user)
category_scores = {}

for rating in user_ratings:
    category = rating.product.category
    category_scores[category] = category_scores.get(category, 0) + rating.rating

# Bước 2: Sort categories theo score
preferred_categories = sorted(category_scores.items(), key=lambda x: x[1], reverse=True)

# Bước 3: Lấy top products từ preferred categories
recommendations = Product.objects.filter(
    category__in=[c[0] for c in preferred_categories[:3]]
).annotate(
    avg_rating=Avg('ratings__rating'),
    rating_count=Count('ratings')
).filter(
    avg_rating__gte=3,
    rating_count__gte=1
).order_by('-avg_rating', '-rating_count')
```

**Parameters**:

- `top_categories=3` - Lấy 3 categories user thích nhất
- `min_rating=3` - Products phải có rating ≥3
- `min_rating_count=1` - Phải có ít nhất 1 rating
- `weight=2` - Độ ưu tiên trung bình

**Ví dụ**:

- User rated: Phở Bò (Vietnamese, 5⭐), Bún Bò (Vietnamese, 4⭐), Burger (Western, 3⭐)
- Category scores: Vietnamese=9, Western=3
  → Recommend: Products khác trong category Vietnamese

---

### 3. **Popularity-Based** (Weight: 0.5x)

**Dựa trên**: "Mọi người đang thích gì?"

**Thuật toán**:

```python
popular_products = Product.objects.annotate(
    interaction_count=Count('interact'),
    avg_rating=Avg('ratings__rating')
).filter(
    interaction_count__gte=5,
    avg_rating__gte=3.5
).order_by('-interaction_count', '-avg_rating')
```

**Parameters**:

- `min_interactions=5` - Tối thiểu 5 lượt tương tác
- `min_rating=3.5` - Rating trung bình ≥3.5
- `weight=0.5` - Độ ưu tiên thấp (chỉ làm fallback)
- `days=30` - Chỉ tính interactions trong 30 ngày

**Khi nào dùng**:

- User mới (chưa có interactions/ratings)
- Bổ sung vào kết quả từ 2 phương pháp trên

---

### 4. **Similar Products** (Category-based)

**Dựa trên**: "Cùng loại với món bạn đang xem"

**Thuật toán**:

```python
current_product = Product.objects.get(id=product_id)

similar = Product.objects.filter(
    category=current_product.category
).exclude(
    id=product_id
).annotate(
    avg_rating=Avg('ratings__rating'),
    rating_count=Count('ratings')
).filter(
    ratings__rating__gte=3
).order_by('-avg_rating', '-rating_count')
```

**Parameters**:

- `category=current_product.category` - Phải cùng category
- `min_rating=3` - Rating ≥3
- `limit=6` - Lấy 6 products tương tự

---

### Công Thức Tổng Hợp (Hybrid)

```python
final_score = (
    collaborative_score * 3 +      # Collaborative Filtering
    content_based_score * 2 +      # Content-Based Filtering
    popularity_score * 0.5         # Popularity-Based
)

recommendations = sorted(candidates, key=lambda p: final_score[p.id], reverse=True)[:limit]
```

**Tại sao weights này?**

- **Collaborative (3x)**: Signal mạnh nhất - users giống nhau có taste tương tự
- **Content-Based (2x)**: Signal khá tốt - preferences về category/type
- **Popularity (0.5x)**: Signal yếu - chỉ dùng làm fallback

---

## 🔄 Data Flow & Tables

### TABLE: `interact`

#### ✅ APIs GHI DATA (INSERT vào `interact`)

##### 1. **GET /api/category/{slug}/products/{id}/** (Product Detail)

Tự động track khi user xem product detail.

```python
# views.py - ProductDetailView
def retrieve(self, request, *args, **kwargs):
    response = super().retrieve(request, *args, **kwargs)

    if request.user.is_authenticated:
        product = self.get_object()
        RecommendationService.track_interaction(request.user, product)

    return response
```

**SQL executed**:

```sql
INSERT INTO interact (user_id, product_id, created_at)
VALUES (1, 5, NOW());
```

##### 2. **POST /api/recommendations/track_interaction/**

Thủ công track khi frontend muốn log interaction khác.

**Request body**:

```json
{
  "product_id": 5
}
```

##### 3. **python manage.py generate_rec_sample_data**

Generate dữ liệu mẫu cho testing.

```bash
python manage.py generate_rec_sample_data --users 10
```

#### 📖 APIs ĐỌC DATA (SELECT từ `interact`)

##### 1. **GET /api/recommendations/** (Personalized Recommendations)

Đọc interact để tính toán recommendations.

**SQL queries**:

```sql
-- Lấy lịch sử interactions của user
SELECT product_id FROM interact
WHERE user_id = 1
ORDER BY created_at DESC;

-- Tìm similar users
SELECT user_id, COUNT(*) as common_count
FROM interact
WHERE product_id IN (5, 8, 12) AND user_id != 1
GROUP BY user_id
HAVING COUNT(*) >= 3;

-- Lấy popular products
SELECT product_id, COUNT(*) as interaction_count
FROM interact
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY product_id
ORDER BY interaction_count DESC;
```

##### 2. **GET /api/interactions/my/** (My Interaction History)

Xem lịch sử products đã xem.

##### 3. **GET /api/admin/recommendations/interactions/** (Admin)

Admin xem tất cả interactions với filters.

**Query params**: `user_id`, `product_id`, `days`, `page`, `page_size`

##### 4. **GET /api/admin/recommendations/statistics/** (Admin)

Thống kê interactions.

---

### TABLE: `recommendation`

#### ✅ APIs GHI DATA (INSERT/UPDATE)

##### 1. **POST /api/recommendations/update_my_recommendations/**

User trigger cập nhật recommendations cho chính mình.

```python
# Tính toán recommendations
recommended_products = RecommendationService.get_user_recommendations(user, limit=10)
product_ids = [p.id for p in recommended_products]

# Update or Create
Recommendation.objects.update_or_create(
    user=user,
    defaults={'product_ids': product_ids, 'updated_at': timezone.now()}
)
```

**SQL executed**:

```sql
-- Nếu chưa tồn tại
INSERT INTO recommendation (user_id, product_ids, updated_at)
VALUES (1, '[5, 8, 12, 15, 20]', NOW());

-- Nếu đã tồn tại
UPDATE recommendation
SET product_ids = '[5, 8, 12, 15, 20]', updated_at = NOW()
WHERE user_id = 1;
```

##### 2. **POST /api/admin/recommendations/batch_update/** (Admin)

Admin trigger batch update cho nhiều users.

**Request body**:

```json
{
  "days": 7, // Active users trong 7 ngày
  "limit": 100 // Tối đa 100 users
}
```

#### 📖 APIs ĐỌC DATA (SELECT)

##### 1. **GET /api/recommendations/stored/**

Lấy pre-computed recommendations (đã lưu sẵn).

```sql
SELECT r.product_ids FROM recommendation r WHERE r.user_id = 1;
SELECT * FROM product WHERE id IN (5, 8, 12, 15, 20);
```

##### 2. **GET /api/admin/recommendations/recommendations/** (Admin)

Admin xem tất cả stored recommendations.

---

## 📡 API Endpoints

### ⭐ Thường Xuyên Sử Dụng (Must Have)

#### 1. **GET /api/recommendations/**

**MỤC ĐÍCH**: Lấy danh sách sản phẩm được cá nhân hóa cho user

**KHI NÀO DÙNG**:

- ✅ Trang chủ: Section "Dành cho bạn" / "Recommended for you"
- ✅ Trang profile: "Món ăn bạn có thể thích"
- ✅ Sau khi user đăng nhập

**LƯU Ý**: Cần authentication (Bearer token)

**Response**:

```json
{
  "results": [
    {
      "id": 5,
      "name": "Spicy Seafood Pizza",
      "price": 15.99,
      "category": "Vietnamese",
      "image_url": "...",
      "avg_rating": 4.5
    }
  ],
  "count": 10
}
```

---

#### 2. **GET /api/recommendations/similar/{product_id}/**

**MỤC ĐÍCH**: Lấy sản phẩm tương tự

**KHI NÀO DÙNG**:

- ✅ Trang chi tiết sản phẩm: Section "Món tương tự"
- ✅ Khi sản phẩm hết hàng: Gợi ý thay thế
- ✅ Cross-selling: "Bạn cũng có thể thích"

**LƯU Ý**: KHÔNG cần authentication (public)

**Query params**: `limit=6` (default)

---

#### 3. **GET /api/products/popular/**

**MỤC ĐÍCH**: Lấy sản phẩm phổ biến/trending

**KHI NÀO DÙNG**:

- ✅ Trang chủ cho user CHƯA đăng nhập
- ✅ Section "Món phổ biến" / "Best sellers"
- ✅ Fallback khi user mới chưa có data

**LƯU Ý**: KHÔNG cần authentication (public)

**Query params**: `limit=8` (default), `days=30`

---

### 🔧 Ít Khi Sử Dụng (Optional)

#### 4. **POST /api/recommendations/track_interaction/**

**MỤC ĐÍCH**: Track thủ công khi user click/view sản phẩm

**KHI NÀO DÙNG**:

- ⚠️ Thường KHÔNG CẦN (tự động track khi xem chi tiết)
- 💡 Có thể dùng: Click vào product card từ list
- 💡 Có thể dùng: Thêm vào giỏ hàng

**Request body**:

```json
{
  "product_id": 5
}
```

---

#### 5. **GET /api/interactions/my/**

**MỤC ĐÍCH**: Xem lịch sử sản phẩm đã xem

**KHI NÀO DÙNG**:

- 💡 Trang profile: "Đã xem gần đây"
- 💡 Debug: Kiểm tra tracking

**Query params**: `limit=20` (default)

---

#### 6. **GET /api/recommendations/stored/**

**MỤC ĐÍCH**: Lấy recommendations đã tính trước

**KHI NÀO DÙNG**:

- ⚠️ Thường KHÔNG DÙNG trực tiếp
- 💡 Khi cần performance cực cao
- 💡 Background job đã chạy batch update

---

#### 7. **POST /api/recommendations/update_my_recommendations/**

**MỤC ĐÍCH**: Force cập nhật recommendations

**KHI NÀO DÙNG**:

- ⚠️ Thường KHÔNG CẦN (auto invalidate cache)
- 💡 Admin panel: Nút "Refresh"
- 💡 Testing/debugging

---

### 🔐 Admin API Endpoints

#### 1. **GET /api/admin/recommendations/statistics/**

```bash
GET /api/admin/recommendations/statistics/?days=30
Authorization: Bearer {admin_token}
```

**Response**:

```json
{
  "period_days": 30,
  "interactions": {
    "total": 150,
    "recent": 120,
    "users_count": 12,
    "avg_per_user": 12.5
  },
  "top_products": [...],
  "top_users": [...]
}
```

---

#### 2. **GET /api/admin/recommendations/interactions/**

```bash
GET /api/admin/recommendations/interactions/?user_id=1&days=7&page=1
Authorization: Bearer {admin_token}
```

**Query params**: `user_id`, `product_id`, `days`, `page`, `page_size`

---

#### 3. **GET /api/admin/recommendations/recommendations/**

```bash
GET /api/admin/recommendations/recommendations/?user_id=1&page=1
Authorization: Bearer {admin_token}
```

---

#### 4. **GET /api/admin/recommendations/ratings/**

```bash
GET /api/admin/recommendations/ratings/?min_rating=4&days=7&page=1
Authorization: Bearer {admin_token}
```

**Query params**: `user_id`, `product_id`, `min_rating`, `days`, `page`, `page_size`

---

#### 5. **POST /api/admin/recommendations/batch_update/**

```bash
POST /api/admin/recommendations/batch_update/
Authorization: Bearer {admin_token}
Body: {"days": 7, "limit": 100}
```

**Mục đích**: Trigger batch update cho nhiều users

---

#### 6. **DELETE /api/admin/recommendations/clear_sample_data/**

```bash
DELETE /api/admin/recommendations/clear_sample_data/
Authorization: Bearer {admin_token}
Body: {"confirm": true}
```

**Mục đích**: Xóa tất cả dữ liệu mẫu

---

## 💾 Pre-computed Recommendations

### Mục Đích

Table `recommendation` được dùng để **lưu trữ sẵn (pre-compute)** danh sách sản phẩm được khuyến nghị, nhằm:

#### 1. **Tăng Performance**

**❌ Vấn đề**: Tính toán real-time rất chậm (2-5 giây)

- Query nhiều tables (interact, ratings, product)
- Tính toán phức tạp (collaborative + content-based filtering)
- Heavy computation cho mỗi request

**✅ Giải pháp**: Pre-compute và cache

**So sánh Performance**:

```
┌─────────────────────┬──────────────┬─────────────────┐
│ Method              │ Response Time│ CPU Usage       │
├─────────────────────┼──────────────┼─────────────────┤
│ Real-time           │ 2-5 seconds  │ High (100%)     │
│ Pre-computed        │ < 100ms      │ Low (5-10%)     │
└─────────────────────┴──────────────┴─────────────────┘
```

---

#### 2. **Background Processing**

**Flow Thực Tế**:

```
┌──────────────────────────────────────────────────────────┐
│  🌙 Nửa đêm (2:00 AM) - Cronjob chạy                     │
│                                                          │
│  POST /api/admin/batch_update/                           │
│  ├─ Lấy 1000 active users (có interact trong 7 ngày)    │
│  ├─ Tính recommendations cho từng user                   │
│  │  ├─ Collaborative filtering                          │
│  │  ├─ Content-based filtering                          │
│  │  └─ Merge & rank                                     │
│  └─ Lưu vào recommendation table                        │
│     (5-10 phút, không ảnh hưởng user)                   │
└──────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────┐
│  ☀️ Buổi sáng - User login                               │
│                                                          │
│  GET /api/recommendations/stored/                        │
│  └─ Lấy ngay từ recommendation table (< 100ms) ✅       │
└──────────────────────────────────────────────────────────┘
```

---

#### 3. **Hybrid Approach**

Hệ thống hiện tại sử dụng **2 chiến lược song song**:

##### **Strategy 1: Real-time + Cache** (Primary)

```python
@classmethod
def get_user_recommendations(cls, user, limit=10):
    # 1. Check cache (1 giờ)
    cache_key = f'recommendations_{user.id}'
    cached = cache.get(cache_key)
    if cached:
        return cached

    # 2. Tính toán nếu cache miss
    recs = cls._calculate_recommendations(user, limit)

    # 3. Save to cache
    cache.set(cache_key, recs, 3600)
    return recs
```

**Ưu điểm**:

- ✅ Recommendations luôn mới (reflect latest interactions)
- ✅ Cache hit = rất nhanh (~20ms)

**Nhược điểm**:

- ❌ Cache miss = chậm (2-5s)
- ❌ High CPU spike khi nhiều cache miss

---

##### **Strategy 2: Pre-computed** (Fallback)

```python
class StoredRecommendationsView(APIView):
    def get(self, request):
        rec = Recommendation.objects.get(user=request.user)
        products = Product.objects.filter(id__in=rec.product_ids)
        return Response({'products': products})
```

**Ưu điểm**:

- ✅ Cực nhanh, stable performance (~50ms)
- ✅ Không tốn CPU server

**Nhược điểm**:

- ❌ Recommendations có thể cũ (vài giờ/ngày)
- ❌ Cần background job để update

---

### Khi Nào Dùng Cái Nào?

| Scenario                 | API Endpoint                   | Strategy          | Lý do                          |
| ------------------------ | ------------------------------ | ----------------- | ------------------------------ |
| **Homepage - Logged in** | `/api/recommendations/`        | Real-time + Cache | Cần recommendations mới nhất   |
| **Mobile App**           | `/api/recommendations/stored/` | Pre-computed      | Tiết kiệm data, nhanh, ổn định |
| **Email Campaign**       | Direct DB query                | Pre-computed      | Gửi hàng loạt                  |
| **First-time User**      | `/api/products/popular/`       | Popularity-based  | Chưa có data                   |
| **After user rates**     | Invalidate cache               | Real-time         | Reflect rating mới             |

---

## 🎨 Frontend Integration

### Trang Chủ (Chưa đăng nhập):

```javascript
// Hiển thị popular products
fetch("/api/products/popular/?limit=8")
  .then((res) => res.json())
  .then((data) => {
    // data.products - array of Product objects
    displayProducts(data.products);
  });
```

### Trang Chủ (Đã đăng nhập):

```javascript
// Hiển thị personalized recommendations
fetch("/api/recommendations/?limit=10", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
})
  .then((res) => res.json())
  .then((data) => {
    // data.results - array of Product objects
    displayRecommendations(data.results);
  });
```

### Trang Chi Tiết Sản Phẩm:

```javascript
// Auto-track khi user view product detail (backend tự động làm)
// Hoặc track thủ công khi click vào product card:
const trackProductClick = async (productId) => {
  await fetch("/api/recommendations/track_interaction/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ product_id: productId }),
  });
};

// Hiển thị similar products
const productId = 123;
fetch(`/api/recommendations/similar/${productId}/?limit=6`)
  .then((res) => res.json())
  .then((data) => {
    displaySimilarProducts(data.similar_products);
  });
```

### Trang Profile:

```javascript
// Recently viewed
fetch("/api/interactions/my/?limit=20", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
})
  .then((res) => res.json())
  .then((data) => {
    displayRecentlyViewed(data.interactions);
  });
```

---

## 🏗️ Kiến Trúc Frontend Gợi Ý

### Homepage

```
┌─────────────────────────────────┐
│         Navigation Bar           │
├─────────────────────────────────┤
│  🔥 Trending / Popular          │
│  [Product] [Product] [Product]   │ ← /api/products/popular/
├─────────────────────────────────┤
│  ✨ Dành Cho Bạn (if logged in) │
│  [Product] [Product] [Product]   │ ← /api/recommendations/
├─────────────────────────────────┤
│  📋 Categories                   │
└─────────────────────────────────┘
```

### Product Detail Page

```
┌─────────────────────────────────┐
│    Product Info & Images        │
│    [Add to Cart] [Rating]       │
├─────────────────────────────────┤
│  💡 Món Tương Tự                │
│  [Product] [Product] [Product]   │ ← /api/recommendations/similar/{id}/
└─────────────────────────────────┘
```

### User Profile

```
┌─────────────────────────────────┐
│  👤 Profile Info                │
├─────────────────────────────────┤
│  📜 Orders History              │
├─────────────────────────────────┤
│  👁️ Đã Xem Gần Đây             │
│  [Product] [Product] [Product]   │ ← /api/interactions/my/
├─────────────────────────────────┤
│  ⭐ Món Bạn Có Thể Thích        │
│  [Product] [Product] [Product]   │ ← /api/recommendations/
└─────────────────────────────────┘
```

---

## ⚙️ Production Setup

### Setup 1: Django Management Command + Cron

**Step 1: Create command**

```python
# management/commands/batch_update_recommendations.py
from django.core.management.base import BaseCommand
from apps.product.recommendation_service import RecommendationService
from apps.users.models import UserAccount
from django.utils import timezone
from datetime import timedelta

class Command(BaseCommand):
    help = 'Batch update recommendations for active users'

    def add_arguments(self, parser):
        parser.add_argument('--days', type=int, default=7)
        parser.add_argument('--limit', type=int, default=1000)

    def handle(self, *args, **options):
        days = options['days']
        limit = options['limit']

        date_from = timezone.now() - timedelta(days=days)
        active_users = UserAccount.objects.filter(
            interact__created_at__gte=date_from
        ).distinct()[:limit]

        success = 0
        for user in active_users:
            try:
                # Trigger update
                RecommendationService.update_stored_recommendations(user)
                success += 1
            except Exception as e:
                self.stdout.write(f"Error for user {user.id}: {e}")

        self.stdout.write(self.style.SUCCESS(
            f"Updated {success}/{active_users.count()} users"
        ))
```

**Step 2: Setup cron**

```bash
# Edit crontab
crontab -e

# Add line (chạy 2:00 AM mỗi ngày)
0 2 * * * cd /path/to/IE221/backend && python manage.py batch_update_recommendations --days 7 --limit 1000
```

---

### Setup 2: Celery Beat (Recommended)

**Step 1: Install Celery**

```bash
pip install celery redis
```

**Step 2: Configure Celery**

```python
# IE221/celery.py
from celery import Celery
from celery.schedules import crontab
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'IE221.settings')

app = Celery('IE221')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Schedule
app.conf.beat_schedule = {
    'update-recommendations-daily': {
        'task': 'apps.product.tasks.batch_update_recommendations',
        'schedule': crontab(hour=2, minute=0),  # 2:00 AM
        'args': (7, 1000)  # days, limit
    },
}
```

**Step 3: Create task**

```python
# apps/product/tasks.py
from celery import shared_task
from .recommendation_service import RecommendationService
from apps.users.models import UserAccount
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def batch_update_recommendations(self, days=7, limit=1000):
    """
    Background task to update recommendations for active users
    """
    try:
        date_from = timezone.now() - timedelta(days=days)
        active_users = UserAccount.objects.filter(
            interact__created_at__gte=date_from
        ).distinct()[:limit]

        success = 0
        errors = []

        for user in active_users:
            try:
                RecommendationService.update_stored_recommendations(user)
                success += 1
            except Exception as e:
                errors.append(f"User {user.id}: {str(e)}")
                logger.error(f"Error updating recommendations for user {user.id}: {e}")

        logger.info(f"Batch update completed: {success}/{active_users.count()} users")

        return {
            'success': success,
            'total': active_users.count(),
            'errors': errors[:10]  # Chỉ log 10 errors đầu
        }

    except Exception as exc:
        logger.error(f"Batch update failed: {exc}")
        raise self.retry(exc=exc, countdown=60)
```

**Step 4: Run Celery workers**

```bash
# Terminal 1: Start Celery worker
celery -A IE221 worker -l info

# Terminal 2: Start Celery beat (scheduler)
celery -A IE221 beat -l info
```

---

### Setup 3: Docker Compose (Production)

```yaml
# docker-compose.yml
version: "3.8"

services:
  web:
    build: ./backend
    command: gunicorn IE221.wsgi:application --bind 0.0.0.0:8000
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    depends_on:
      - db
      - redis
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/ie221
      - REDIS_URL=redis://redis:6379/0

  celery_worker:
    build: ./backend
    command: celery -A IE221 worker -l info
    volumes:
      - ./backend:/app
    depends_on:
      - db
      - redis
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/ie221
      - REDIS_URL=redis://redis:6379/0

  celery_beat:
    build: ./backend
    command: celery -A IE221 beat -l info
    volumes:
      - ./backend:/app
    depends_on:
      - db
      - redis
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/ie221
      - REDIS_URL=redis://redis:6379/0

  db:
    image: postgres:14
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=ie221
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

**Run production**:

```bash
docker-compose up -d
```

---

## 🎯 Best Practices

### 1. **Performance Tips**

- **Cache ở Frontend**: Cache popular products 5-10 phút
- **Lazy Load**: Load recommendations sau khi page load xong
- **Prefetch**: Prefetch similar products khi hover vào product card
- **Debounce**: Nếu track clicks, debounce để tránh spam API

### 2. **Data Quality**

- Định kỳ clean up old interactions (> 6 tháng)
- Validate ratings trước khi lưu
- Monitor data distribution (tránh bias)

### 3. **Monitoring**

```python
# Track metrics
- Recommendation click-through rate (CTR)
- Conversion rate từ recommendations
- Average response time
- Cache hit ratio
- Error rate
```

### 4. **A/B Testing**

```python
# Test different strategies
- Collaborative only vs Hybrid
- Different weights (3:2:0.5 vs 2:2:1)
- Real-time vs Pre-computed
```

### 5. **Fallback Strategy**

```python
def get_recommendations_with_fallback(user, limit=10):
    # Try personalized
    recs = get_user_recommendations(user, limit)

    # Fallback to popular if not enough
    if len(recs) < limit:
        popular = get_popular_products(limit - len(recs))
        recs.extend(popular)

    return recs
```

---

## 🔍 Troubleshooting

### Không có recommendations?

```bash
# Kiểm tra user có interactions chưa
python manage.py shell
>>> from apps.users.models import UserAccount
>>> from apps.product.models import Interact
>>> user = UserAccount.objects.get(email='user@example.com')
>>> Interact.objects.filter(user=user).count()
```

Nếu = 0, cần tạo dữ liệu hoặc user chưa xem sản phẩm nào.

### Recommendations không đủ đa dạng?

Tăng số users và interactions:

```bash
python manage.py generate_rec_sample_data --users 30 --interactions-per-user 25
```

### API trả về 401 Unauthorized?

Kiểm tra token có đúng không và chưa expired.

### Performance chậm?

- Kiểm tra cache có hoạt động không
- Xem xét dùng pre-computed recommendations
- Optimize database queries (add indexes)

---

## 📊 Summary Table

| API Endpoint                                      | Method | Table                 | Action      | When                 | Auth Required |
| ------------------------------------------------- | ------ | --------------------- | ----------- | -------------------- | ------------- |
| `/api/category/{slug}/products/{id}/`             | GET    | `interact`            | INSERT      | Auto khi view detail | ✅            |
| `/api/recommendations/track_interaction/`         | POST   | `interact`            | INSERT      | Manual track         | ✅            |
| `/api/recommendations/`                           | GET    | `interact`, `ratings` | SELECT      | Tính recommendations | ✅            |
| `/api/recommendations/similar/{id}/`              | GET    | `product`             | SELECT      | Get similar products | ❌            |
| `/api/products/popular/`                          | GET    | `interact`, `product` | SELECT      | Get popular products | ❌            |
| `/api/interactions/my/`                           | GET    | `interact`            | SELECT      | Xem lịch sử          | ✅            |
| `/api/recommendations/stored/`                    | GET    | `recommendation`      | SELECT      | Get pre-computed     | ✅            |
| `/api/recommendations/update_my_recommendations/` | POST   | `recommendation`      | UPSERT      | User trigger update  | ✅            |
| `/api/admin/.../batch_update/`                    | POST   | `recommendation`      | BULK UPSERT | Admin batch update   | ✅ Admin      |
| `/api/admin/.../statistics/`                      | GET    | All tables            | SELECT      | View stats           | ✅ Admin      |

---

## 🔐 Verification Queries

### Check interact table:

```sql
-- Total interactions
SELECT COUNT(*) FROM interact;

-- Recent interactions
SELECT * FROM interact
ORDER BY created_at DESC
LIMIT 10;

-- Interactions for specific user
SELECT p.name, i.created_at
FROM interact i
JOIN product p ON i.product_id = p.id
WHERE i.user_id = 1
ORDER BY i.created_at DESC;
```

### Check recommendation table:

```sql
-- Total stored recommendations
SELECT COUNT(*) FROM recommendation;

-- Recommendations for specific user
SELECT * FROM recommendation
WHERE user_id = 1;

-- Recently updated recommendations
SELECT u.email, r.product_ids, r.updated_at
FROM recommendation r
JOIN users u ON r.user_id = u.id
ORDER BY r.updated_at DESC
LIMIT 10;
```

### Check ratings table:

```sql
-- Average rating per product
SELECT p.name, AVG(r.rating) as avg_rating, COUNT(*) as rating_count
FROM ratings r
JOIN product p ON r.product_id = p.id
GROUP BY p.id, p.name
ORDER BY avg_rating DESC
LIMIT 10;
```

---

## 📚 Resources

- **Project Repo**: `feat/be/recommendation-system` branch
- **Related Docs**:
  - `DATA_FLOW.md` - Chi tiết data flow
  - `QUICK_START.md` - Hướng dẫn setup nhanh
  - `RECOMMENDATION_SYSTEM.md` - Chi tiết thuật toán
  - `RECOMMENDATION_TABLE_PURPOSE.md` - Giải thích pre-computed strategy

---

**Last Updated**: November 21, 2025  
**Version**: 1.0  
**Author**: IE221 Development Team
