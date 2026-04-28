"""
Performance optimization migration - Add indexes for leads module.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('leads', '0001_initial'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='lead',
            index=models.Index(fields=['business'], name='lead_business_idx'),
        ),
        migrations.AddIndex(
            model_name='lead',
            index=models.Index(fields=['status'], name='lead_status_idx'),
        ),
        migrations.AddIndex(
            model_name='lead',
            index=models.Index(fields=['created_at'], name='lead_created_at_idx'),
        ),
        migrations.AddIndex(
            model_name='lead',
            index=models.Index(fields=['email'], name='lead_email_idx'),
        ),
        migrations.AddIndex(
            model_name='lead',
            index=models.Index(fields=['business', 'status'], name='lead_business_status_idx'),
        ),
    ]
