from django.db import models
from django.contrib.postgres.fields import ArrayField
from apps.auth.models import User


class Business(models.Model):
    """Business model for business owner profiles."""

    CATEGORY_CHOICES = [
        ('restaurant', '🍽️ Restaurant'),
        ('cafe', '☕ Cafe'),
        ('retail', '🛍️ Retail'),
        ('service', '🔧 Service'),
        ('beauty', '💇 Beauty'),
        ('fitness', '💪 Fitness'),
        ('education', '📚 Education'),
        ('healthcare', '⚕️ Healthcare'),
        ('entertainment', '🎭 Entertainment'),
        ('travel', '✈️ Travel'),
        ('real_estate', '🏠 Real Estate'),
        ('other', '📌 Other'),
    ]

    # Relationships
    owner = models.OneToOneField(User, on_delete=models.CASCADE, related_name='business')

    # Basic Info
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True, null=True)
    logo = models.ImageField(upload_to='businesses/logos/', blank=True, null=True)

    # Contact Details
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    whatsapp = models.CharField(max_length=20, blank=True, null=True)
    website = models.URLField(blank=True, null=True)

    # Location
    map_lat = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    map_lng = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    pincode = models.CharField(max_length=20, blank=True, null=True)
    country = models.CharField(max_length=100, default='India')

    # Service Coverage
    service_radius = models.IntegerField(default=5)  # in km
    service_areas = ArrayField(models.CharField(max_length=255), default=list, blank=True)

    # Social Links
    facebook = models.URLField(blank=True, null=True)
    instagram = models.URLField(blank=True, null=True)
    youtube = models.URLField(blank=True, null=True)
    linkedin = models.URLField(blank=True, null=True)

    # Business Info
    business_hours = models.JSONField(default=dict, blank=True)  # {day: {open, close}}
    accepted_payments = ArrayField(models.CharField(max_length=50), default=list, blank=True)

    # Verification
    is_verified = models.BooleanField(default=False)
    verification_status = models.CharField(
        max_length=50,
        choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')],
        default='pending'
    )
    verified_at = models.DateTimeField(blank=True, null=True)

    # Status
    is_active = models.BooleanField(default=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['owner']),
            models.Index(fields=['category']),
            models.Index(fields=['is_verified']),
            models.Index(fields=['city']),
        ]

    def __str__(self):
        return self.name


class BusinessDocument(models.Model):
    """Documents for business verification."""

    DOCUMENT_TYPES = [
        ('business_license', 'Business License/Registration'),
        ('tax_id', 'Tax ID (GSTIN)'),
        ('owner_id', 'Owner ID Proof (Aadhar/PAN)'),
        ('address_proof', 'Address Proof'),
        ('bank_details', 'Bank Account Details'),
    ]

    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPES)
    file = models.FileField(upload_to='documents/%Y/%m/%d/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    # Verification
    is_verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_documents')
    verified_at = models.DateTimeField(blank=True, null=True)
    verification_notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-uploaded_at']
        unique_together = ['business', 'document_type']
        indexes = [
            models.Index(fields=['business']),
            models.Index(fields=['document_type']),
            models.Index(fields=['is_verified']),
        ]

    def __str__(self):
        return f"{self.business.name} - {self.get_document_type_display()}"


class BusinessPhoto(models.Model):
    """Photos for business gallery."""

    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='photos')
    photo = models.ImageField(upload_to='business_photos/%Y/%m/%d/')
    caption = models.CharField(max_length=255, blank=True, null=True)
    order = models.IntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']
        indexes = [
            models.Index(fields=['business']),
        ]

    def __str__(self):
        return f"{self.business.name} - Photo"


class BusinessTeamMember(models.Model):
    """Team members for a business."""

    ROLE_CHOICES = [
        ('owner', 'Owner'),
        ('manager', 'Manager'),
        ('staff', 'Staff'),
    ]

    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='team')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='staff')
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['business', 'email']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.business.name} - {self.name}"
