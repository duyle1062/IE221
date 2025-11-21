# 📘 Comprehensive Recommendation System Documentation

Tài liệu này tổng hợp kiến trúc, thuật toán, luồng dữ liệu và hướng dẫn vận hành cho hệ thống gợi ý sản phẩm của dự án (IE221 Food Ordering Platform). Hệ thống được xây dựng trên Django, tập trung vào hiệu năng, sự đơn giản và khả năng mở rộng mà không cần hạ tầng Machine Learning phức tạp.

---

## 1. Kiến Trúc & Cơ Sở Dữ Liệu (Database & Models)

Hệ thống xoay quanh 3 bảng dữ liệu chính để theo dõi hành vi và lưu trữ kết quả:

### 1.1. Bảng `interact` (Lịch sử tương tác)

- **Mục đích:** Lưu trữ mọi hành vi xem/click của user đối với sản phẩm.
- **Trigger:**
  - **Tự động (Auto):** Khi user gọi API xem chi tiết sản phẩm (`GET /api/category/.../products/{id}/`).
  - **Thủ công (Manual):** Qua API `POST /api/recommendations/track_interaction/` (khi click card, add to cart).
- **Dữ liệu:** `user_id`, `product_id`, `created_at`.

### 1.2. Bảng `ratings` (Đánh giá)

- **Mục đích:** Lưu trữ đánh giá 1-5 sao của user. Đây là tín hiệu rõ ràng nhất về sở thích.
- **Dữ liệu:** `user_id`, `product_id`, `rating`, `comment`.

### 1.3. Bảng `recommendation` (Lưu trữ kết quả tính sẵn)

- **Mục đích:** Lưu danh sách sản phẩm đã được tính toán (Pre-computed) cho từng user để tăng tốc độ phản hồi.
- **Cấu trúc:** `user_id` (Unique), `product_ids` (JSON Array), `updated_at`.
- **Lý do tồn tại:** Việc tính toán realtime rất tốn kém (2-5s), bảng này giúp response time giảm xuống < 100ms.

---

## 2. Chiến Lược & Thuật Toán Gợi Ý (Algorithms)

Hệ thống sử dụng mô hình **Hybrid Recommendation** (Kết hợp) với trọng số để đưa ra gợi ý chính xác nhất.

### Công thức tổng quát:

$$Final Score = (Collaborative \times 3) + (ContentBased \times 2) + (Popularity \times 0.5)$$

### Chi tiết các chiến lược:

| Chiến lược                     | Trọng số | Logic ("Tại sao gợi ý món này?")             | Cách hoạt động                                                                                                                    |
| :----------------------------- | :------: | :------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| **1. Collaborative Filtering** |  **3x**  | _"Những người giống bạn cũng thích món này"_ | Tìm users có lịch sử `interact` giống user hiện tại, sau đó lấy các món họ rate cao (≥4 sao). Yêu cầu tối thiểu 3 sản phẩm chung. |
| **2. Content-Based Filtering** |  **2x**  | _"Bạn thích món kiểu này"_                   | Phân tích các category mà user hay rate cao. Gợi ý các món khác cùng category (sorted by rating & interaction).                   |
| **3. Popularity-Based**        | **0.5x** | _"Món này đang hot"_                         | Dựa trên tổng số lượt `interact` (trong 30 ngày) và `avg_rating`. Dùng làm fallback cho user mới hoặc điền đầy danh sách.         |
| **4. Similar Products**        |   N/A    | _"Món tương tự món đang xem"_                | Dùng cho trang chi tiết. Lọc cùng Category + Rating ≥ 3 + Sort theo độ phổ biến.                                                  |

---

## 3. Chiến Lược Hiệu Năng (Performance & Optimization)

Để đảm bảo hệ thống chịu tải tốt và phản hồi nhanh, một cơ chế **Hybrid Approach** 3 tầng được áp dụng:

### Tầng 1: Caching (Nhanh nhất - 10-20ms)

- Lưu kết quả vào Redis/Memcached trong 1 giờ.
- Luôn được kiểm tra đầu tiên khi có request.

### Tầng 2: Stored Recommendations (Nhanh - 50-100ms)

- Nếu Cache miss, hệ thống đọc từ bảng `recommendation` (Pre-computed DB).
- Dữ liệu này được cập nhật định kỳ (Batch Update) vào giờ thấp điểm (ví dụ: 2:00 AM) thông qua Cronjob hoặc Celery.

### Tầng 3: Real-time Calculation (Chậm - 2-5s)

- Phương án cuối cùng (Fallback) nếu chưa có Cache và chưa có Stored Data (ví dụ: user mới tạo).
- Tính toán ngay lập tức bằng thuật toán ở mục 2, sau đó lưu vào Cache để lần sau nhanh hơn.

---

## 4. Hướng Dẫn Tích Hợp API (Integration Guide)

### 4.1. Dành cho Frontend (User Flow)

#### A. Trang Chủ (Homepage)

- **Chưa đăng nhập:** Lấy món phổ biến.
  ```http
  GET /api/products/popular/?limit=8
  ```
- **Đã đăng nhập:** Lấy gợi ý cá nhân hóa.
  ```http
  GET /api/recommendations/?limit=10
  Header: Authorization: Bearer {token}
  ```

#### B. Trang Chi Tiết (Product Detail)

- **Tự động Track:** Backend tự ghi log khi gọi API chi tiết sản phẩm.
- **Lấy món tương tự:**
  ```http
  GET /api/recommendations/similar/{product_id}/?limit=6
  ```

#### C. Trang Profile

- **Lịch sử đã xem:**
  ```http
  GET /api/interactions/my/?limit=20
  Header: Authorization: Bearer {token}
  ```

### 4.2. Dành cho Admin (Management)

- **Xem thống kê hệ thống:** `GET /api/admin/recommendations/statistics/`
- **Kích hoạt cập nhật hàng loạt (Batch Update):**
  ```http
  POST /api/admin/recommendations/batch_update/
  Body: {"days": 7, "limit": 1000}
  ```
- **Xóa dữ liệu mẫu:** `DELETE /api/admin/recommendations/clear_sample_data/`

---

## 5. Hướng Dẫn Vận Hành (Operations & Quick Start)

### 5.1. Setup ban đầu

1.  **Chạy Migration:**
    ```bash
    python manage.py migrate
    ```
2.  **Tạo dữ liệu mẫu (Fake Data):**
    ```bash
    # Tạo 20 users, mỗi user xem 20 món
    python manage.py generate_rec_sample_data --users 20 --interactions-per-user 20
    ```

### 5.2. Kiểm tra hệ thống

Có thể kiểm tra nhanh qua Python Shell:

```python
python manage.py shell
>>> from apps.product.models import Interact, Ratings
>>> print(Interact.objects.count()) # Kiểm tra số lượng tương tác
```

### 5.3. Setup Production (Cronjob/Celery)

Để hệ thống chạy mượt mà, cần thiết lập tác vụ chạy ngầm để cập nhật bảng recommendation hàng ngày.

#### Cách 1: Cronjob đơn giản (Chạy lúc 2:00 sáng)

```
0 2 * * * cd /path/to/project && python manage.py batch_update_recommendations --days 7
```

#### Cách 2: Celery Beat (Khuyên dùng)

Cấu hình worker để chạy task apps.product.tasks.batch_update_recommendations định kỳ.

### 5.4. Troubleshooting

Không có recommendations? -> Kiểm tra user đã có interaction chưa (xem ít nhất 3-5 món).

API chậm? -> Kiểm tra xem Redis cache có hoạt động không hoặc bảng recommendation có dữ liệu không.

Recommendations không đổi? -> Cache đang lưu (1h). Gọi API update_my_recommendations để force update nếu cần test.
