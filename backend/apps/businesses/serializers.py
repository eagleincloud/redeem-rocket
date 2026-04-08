from rest_framework import serializers
from .models import Business, BusinessDocument, BusinessPhoto, BusinessTeamMember


class BusinessDocumentSerializer(serializers.ModelSerializer):
    """Serializer for business documents."""

    class Meta:
        model = BusinessDocument
        fields = (
            'id', 'document_type', 'file', 'uploaded_at',
            'is_verified', 'verified_at', 'verification_notes'
        )
        read_only_fields = ('id', 'uploaded_at', 'verified_at')


class BusinessPhotoSerializer(serializers.ModelSerializer):
    """Serializer for business photos."""

    class Meta:
        model = BusinessPhoto
        fields = ('id', 'photo', 'caption', 'order', 'uploaded_at')
        read_only_fields = ('id', 'uploaded_at')


class BusinessTeamMemberSerializer(serializers.ModelSerializer):
    """Serializer for business team members."""

    class Meta:
        model = BusinessTeamMember
        fields = ('id', 'name', 'email', 'phone', 'role', 'is_active')


class BusinessListSerializer(serializers.ModelSerializer):
    """Serializer for listing businesses."""

    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    photo_count = serializers.SerializerMethodField()

    class Meta:
        model = Business
        fields = (
            'id', 'name', 'category', 'description', 'logo',
            'city', 'is_verified', 'owner_name', 'photo_count', 'created_at'
        )

    def get_photo_count(self, obj):
        return obj.photos.count()


class BusinessDetailSerializer(serializers.ModelSerializer):
    """Serializer for business details."""

    documents = BusinessDocumentSerializer(many=True, read_only=True)
    photos = BusinessPhotoSerializer(many=True, read_only=True)
    team = BusinessTeamMemberSerializer(many=True, read_only=True)
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    owner_email = serializers.CharField(source='owner.email', read_only=True)

    class Meta:
        model = Business
        fields = (
            'id', 'name', 'category', 'description', 'logo',
            'email', 'phone', 'whatsapp', 'website',
            'map_lat', 'map_lng', 'address', 'city', 'state', 'pincode', 'country',
            'service_radius', 'service_areas',
            'facebook', 'instagram', 'youtube', 'linkedin',
            'business_hours', 'accepted_payments',
            'is_verified', 'verification_status',
            'owner_name', 'owner_email',
            'documents', 'photos', 'team',
            'created_at', 'updated_at'
        )
        read_only_fields = (
            'id', 'is_verified', 'verification_status',
            'owner_name', 'owner_email',
            'created_at', 'updated_at'
        )


class BusinessCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating businesses."""

    class Meta:
        model = Business
        fields = (
            'name', 'category', 'description', 'logo',
            'email', 'phone', 'whatsapp', 'website',
            'map_lat', 'map_lng', 'address', 'city', 'state', 'pincode', 'country',
            'service_radius', 'service_areas',
            'facebook', 'instagram', 'youtube', 'linkedin',
            'business_hours', 'accepted_payments'
        )
