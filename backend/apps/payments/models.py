from django.db import models
from apps.auth.models import User
from apps.orders.models import Order


class Payment(models.Model):
    """Payment model."""

    PAYMENT_METHOD_CHOICES = [
        ('upi', 'UPI'),
        ('card', 'Credit/Debit Card'),
        ('wallet', 'Wallet'),
        ('bank_transfer', 'Bank Transfer'),
        ('cash', 'Cash'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='payment')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=50, choices=PAYMENT_METHOD_CHOICES)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    transaction_id = models.CharField(max_length=255, unique=True, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Payment #{self.id} - {self.get_status_display()}"
