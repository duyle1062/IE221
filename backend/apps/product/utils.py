import boto3
import uuid
from django.conf import settings
from botocore.exceptions import ClientError


class S3Handler:
    """Handle all S3 operations for product images using presigned URLs"""

    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION_NAME
        )
        self.bucket_name = settings.AWS_STORAGE_BUCKET_NAME
        self.cloudfront_domain = settings.AWS_CLOUDFRONT_DOMAIN

    def generate_presigned_upload_url(self, product_id, filename, content_type='image/jpeg'):
        """
        Generate a presigned URL for direct upload to S3 from frontend

        Args:
            product_id: ID of the product
            filename: Original filename (will be modified with UUID)
            content_type: MIME type of the file

        Returns:
            dict: Contains 'url', 'fields', and 's3_key' for upload
        """
        # Validate content type
        allowed_types = ['image/jpeg', 'image/png', 'image/webp']
        if content_type not in allowed_types:
            raise ValueError(f"Invalid content type. Allowed: {', '.join(allowed_types)}")

        # Generate unique S3 key
        file_extension = self._get_extension_from_content_type(content_type)
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        s3_key = f"product/{product_id}/{unique_filename}"

        try:
            # Generate presigned POST URL
            presigned_post = self.s3_client.generate_presigned_post(
                Bucket=self.bucket_name,
                Key=s3_key,
                Fields={
                    'Content-Type': content_type,
                },
                Conditions=[
                    {'Content-Type': content_type},
                    ['content-length-range', 0, 5242880],  # Max 5MB
                ],
                ExpiresIn=300  # URL expires in 5 minutes
            )

            # Add s3_key to response
            presigned_post['s3_key'] = s3_key
            presigned_post['public_url'] = self._generate_public_url(s3_key)

            return presigned_post

        except ClientError as e:
            raise Exception(f"Failed to generate presigned URL: {str(e)}")

    def file_exists(self, s3_key):
        """
        Check if a file exists on S3

        Args:
            s3_key: S3 key of the file to check

        Returns:
            bool: True if file exists, False otherwise
        """
        try:
            self.s3_client.head_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            return True
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', '')
            if error_code == '404':
                return False
            # For other errors, re-raise
            raise

    def delete_product_image(self, s3_key):
        """
        Delete a product image from S3

        Args:
            s3_key: S3 key of the file to delete (e.g., "product/123/uuid.jpg")

        Returns:
            bool: True if deleted successfully
        """
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            return True
        except ClientError as e:
            # Log error but don't raise - file might already be deleted
            print(f"Error deleting from S3: {str(e)}")
            return False

    def delete_product_folder(self, product_id):
        """
        Delete all images for a product (entire folder)

        Args:
            product_id: ID of the product

        Returns:
            int: Number of files deleted
        """
        prefix = f"product/{product_id}/"
        deleted_count = 0

        try:
            # List all objects with the prefix
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=prefix
            )

            if 'Contents' not in response:
                return 0

            # Delete all objects
            objects_to_delete = [{'Key': obj['Key']} for obj in response['Contents']]

            if objects_to_delete:
                delete_response = self.s3_client.delete_objects(
                    Bucket=self.bucket_name,
                    Delete={'Objects': objects_to_delete}
                )
                deleted_count = len(delete_response.get('Deleted', []))

            return deleted_count

        except ClientError as e:
            print(f"Error deleting product folder: {str(e)}")
            return deleted_count

    def generate_public_url(self, s3_key):
        """
        Generate public URL for an S3 object

        Args:
            s3_key: S3 key of the object

        Returns:
            str: Full URL (CloudFront or S3)
        """
        return self._generate_public_url(s3_key)

    def _generate_public_url(self, s3_key):
        """
        Internal method to generate URL

        Args:
            s3_key: S3 key of the object

        Returns:
            str: Full URL (CloudFront or S3)
        """
        if self.cloudfront_domain:
            # Use CloudFront URL
            return f"https://{self.cloudfront_domain}/{s3_key}"
        else:
            # Use S3 URL
            return f"https://{self.bucket_name}.s3.{settings.AWS_S3_REGION_NAME}.amazonaws.com/{s3_key}"

    def _get_extension_from_content_type(self, content_type):
        """
        Get file extension from content type

        Args:
            content_type: MIME type

        Returns:
            str: File extension with dot (e.g., '.jpg')
        """
        extensions = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/webp': '.webp'
        }
        return extensions.get(content_type, '.jpg')
        
    def extract_s3_key_from_url(self, url):
        """Extract S3 key from full URL"""
        if self.cloudfront_domain and self.cloudfront_domain in url:
            return url.split(self.cloudfront_domain + '/')[-1]
        if self.bucket_name in url:
            parts = url.split('.amazonaws.com/')
            if len(parts) > 1:
                return parts[-1]
        if url.startswith('product/'):
            return url
        return None   

# Create a singleton instance
s3_handler = S3Handler()
