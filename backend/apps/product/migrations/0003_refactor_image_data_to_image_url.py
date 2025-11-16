# Generated migration for refactoring image_data to image_url

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('product', '0002_remove_product_image_urls_productimage'),
    ]

    operations = [
        # Remove old binary field and content type field
        migrations.RemoveField(
            model_name='productimage',
            name='image_data',
        ),
        migrations.RemoveField(
            model_name='productimage',
            name='image_content_type',
        ),
        # Add new text field for image URL
        migrations.AddField(
            model_name='productimage',
            name='image_url',
            field=models.TextField(default=''),
            preserve_default=False,
        ),
    ]
