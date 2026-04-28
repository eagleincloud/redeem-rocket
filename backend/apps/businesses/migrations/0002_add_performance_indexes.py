"""
Performance optimization migration - Add database indexes for frequently accessed fields.
This migration optimizes query performance for common filtering and lookup operations.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('businesses', '0001_initial'),
    ]

    operations = [
        # Business model indexes
        migrations.AddIndex(
            model_name='business',
            index=models.Index(fields=['owner'], name='business_owner_idx'),
        ),
        migrations.AddIndex(
            model_name='business',
            index=models.Index(fields=['category'], name='business_category_idx'),
        ),
        migrations.AddIndex(
            model_name='business',
            index=models.Index(fields=['city'], name='business_city_idx'),
        ),
        migrations.AddIndex(
            model_name='business',
            index=models.Index(fields=['email'], name='business_email_idx'),
        ),
        migrations.AddIndex(
            model_name='business',
            index=models.Index(fields=['created_at'], name='business_created_at_idx'),
        ),
        migrations.AddIndex(
            model_name='business',
            index=models.Index(fields=['owner', 'created_at'], name='business_owner_created_idx'),
        ),
    ]
