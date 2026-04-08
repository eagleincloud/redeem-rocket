from django.db import models
from apps.auth.models import User
from apps.businesses.models import Business


class Lead(models.Model):
    """Lead model for sales tracking."""

    STATUS_CHOICES = [
        ('new', 'New'),
        ('interested', 'Interested'),
        ('contacted', 'Contacted'),
        ('converted', 'Converted'),
        ('lost', 'Lost'),
    ]

    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='leads')
    customer_name = models.CharField(max_length=255)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=20)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='new')
    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Lead - {self.customer_name} ({self.business.name})"
