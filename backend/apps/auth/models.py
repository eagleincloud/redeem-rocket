from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """Extended User model with additional fields for the application."""

    ROLE_CHOICES = [
        ('customer', 'Customer'),
        ('business_owner', 'Business Owner'),
        ('admin', 'Administrator'),
    ]

    # Basic Info
    email = models.EmailField(_('email address'), unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='customer')

    # Profile
    profile_photo = models.ImageField(upload_to='users/profiles/', blank=True, null=True)
    bio = models.TextField(blank=True, null=True)

    # Account Status
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login_ip = models.GenericIPAddressField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['phone']),
            models.Index(fields=['role']),
        ]

    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"

    def get_role_display(self):
        return dict(self.ROLE_CHOICES).get(self.role, self.role)
