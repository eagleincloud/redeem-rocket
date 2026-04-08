from rest_framework import status, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404

from .models import Business, BusinessDocument, BusinessPhoto, BusinessTeamMember
from .serializers import (
    BusinessListSerializer,
    BusinessDetailSerializer,
    BusinessCreateUpdateSerializer,
    BusinessDocumentSerializer,
    BusinessPhotoSerializer,
    BusinessTeamMemberSerializer,
)


class IsBusinessOwnerOrReadOnly(permissions.BasePermission):
    """Permission to only allow business owners to edit their business."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.owner == request.user


class BusinessViewSet(viewsets.ModelViewSet):
    """ViewSet for managing businesses."""

    queryset = Business.objects.all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = (MultiPartParser, FormParser)

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return BusinessCreateUpdateSerializer
        elif self.action == 'retrieve':
            return BusinessDetailSerializer
        return BusinessListSerializer

    def get_queryset(self):
        queryset = Business.objects.all()

        # Filter by city
        city = self.request.query_params.get('city', None)
        if city:
            queryset = queryset.filter(city=city)

        # Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)

        # Filter by verified
        verified = self.request.query_params.get('verified', None)
        if verified:
            queryset = queryset.filter(is_verified=verified.lower() == 'true')

        return queryset

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def perform_destroy(self, instance):
        if instance.owner != self.request.user:
            raise permissions.PermissionDenied("You cannot delete another user's business")
        instance.delete()

    @action(detail=True, methods=['get'])
    def my_business(self, request):
        """Get current user's business."""
        try:
            business = Business.objects.get(owner=request.user)
            serializer = BusinessDetailSerializer(business)
            return Response(serializer.data)
        except Business.DoesNotExist:
            return Response(
                {'error': 'Business not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def upload_document(self, request, pk=None):
        """Upload a document for the business."""
        business = self.get_object()
        if business.owner != request.user:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = BusinessDocumentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(business=business)
            return Response(
                {'message': 'Document uploaded', 'document': serializer.data},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get', 'post'])
    def documents(self, request, pk=None):
        """List or create documents for the business."""
        business = self.get_object()

        if request.method == 'GET':
            documents = business.documents.all()
            serializer = BusinessDocumentSerializer(documents, many=True)
            return Response(serializer.data)

        if request.method == 'POST':
            if business.owner != request.user:
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            serializer = BusinessDocumentSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(business=business)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def upload_photo(self, request, pk=None):
        """Upload a photo for the business."""
        business = self.get_object()
        if business.owner != request.user:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = BusinessPhotoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(business=business)
            return Response(
                {'message': 'Photo uploaded', 'photo': serializer.data},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get', 'post'])
    def photos(self, request, pk=None):
        """List or create photos for the business."""
        business = self.get_object()

        if request.method == 'GET':
            photos = business.photos.all()
            serializer = BusinessPhotoSerializer(photos, many=True)
            return Response(serializer.data)

        if request.method == 'POST':
            if business.owner != request.user:
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            serializer = BusinessPhotoSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(business=business)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get', 'post'])
    def team(self, request, pk=None):
        """List or add team members for the business."""
        business = self.get_object()

        if request.method == 'GET':
            team = business.team.all()
            serializer = BusinessTeamMemberSerializer(team, many=True)
            return Response(serializer.data)

        if request.method == 'POST':
            if business.owner != request.user:
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            serializer = BusinessTeamMemberSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(business=business)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
