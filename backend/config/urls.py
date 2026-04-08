from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),

    # JWT Auth endpoints
    path('api/v1/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # App URLs
    path('api/v1/auth/', include('apps.auth.urls')),
    path('api/v1/businesses/', include('apps.businesses.urls')),
    path('api/v1/users/', include('apps.users.urls')),
    path('api/v1/documents/', include('apps.documents.urls')),
    path('api/v1/orders/', include('apps.orders.urls')),
    path('api/v1/leads/', include('apps.leads.urls')),
    path('api/v1/payments/', include('apps.payments.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
