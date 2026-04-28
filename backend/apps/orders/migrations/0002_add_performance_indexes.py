"""
Performance optimization migration - Add indexes for orders module.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0001_initial'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='order',
            index=models.Index(fields=['business'], name='order_business_idx'),
        ),
        migrations.AddIndex(
            model_name='order',
            index=models.Index(fields=['user'], name='order_user_idx'),
        ),
        migrations.AddIndex(
            model_name='order',
            index=models.Index(fields=['status'], name='order_status_idx'),
        ),
        migrations.AddIndex(
            model_name='order',
            index=models.Index(fields=['created_at'], name='order_created_at_idx'),
        ),
        migrations.AddIndex(
            model_name='order',
            index=models.Index(fields=['business', 'status'], name='order_business_status_idx'),
        ),
    ]
