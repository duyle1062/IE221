"""
Migration script to convert old image_urls to new product_images table
Run this after applying migrations if you have existing products with image_urls
"""

from apps.product.models import Product, ProductImage
import requests
import base64
from io import BytesIO
from PIL import Image

def download_and_convert_image(url):
    """Download image from URL and convert to bytes"""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        # Get content type
        content_type = response.headers.get('content-type', 'image/jpeg')
        
        # Convert to bytes
        image_bytes = response.content
        
        return image_bytes, content_type
    except Exception as e:
        print(f"Failed to download {url}: {str(e)}")
        return None, None

def migrate_product_images():
    """Migrate all products that had image_urls to new product_images table"""
    
    # This is for reference - image_urls field no longer exists
    # If you have a backup or the old data, you can use this script
    
    # Example: If you have the data from products.json
    products_data = [
        {
            "id": 1,
            "image_urls": "{/images/pizza/margherita.jpg}"
        },
        # ... more products
    ]
    
    migrated = 0
    failed = 0
    
    for data in products_data:
        try:
            product = Product.objects.get(id=data['id'])
            
            # Skip if already has images
            if product.images.exists():
                print(f"Product {product.id} already has images, skipping")
                continue
            
            image_url = data['image_urls'].strip('{}')
            
            # If URL is relative, convert to absolute
            if image_url.startswith('/'):
                # You might need to adjust this based on your setup
                image_url = f"http://yourdomain.com{image_url}"
            
            # Download image
            image_bytes, content_type = download_and_convert_image(image_url)
            
            if image_bytes:
                # Create ProductImage
                ProductImage.objects.create(
                    product=product,
                    image_data=image_bytes,
                    image_content_type=content_type,
                    is_primary=True,
                    sort_order=0
                )
                migrated += 1
                print(f"✓ Migrated product {product.id}: {product.name}")
            else:
                failed += 1
                print(f"✗ Failed product {product.id}: {product.name}")
                
        except Product.DoesNotExist:
            print(f"Product {data['id']} not found")
            failed += 1
        except Exception as e:
            print(f"Error migrating product {data.get('id')}: {str(e)}")
            failed += 1
    
    print(f"\n=== Migration Summary ===")
    print(f"Migrated: {migrated}")
    print(f"Failed: {failed}")
    print(f"Total: {migrated + failed}")

if __name__ == "__main__":
    migrate_product_images()
