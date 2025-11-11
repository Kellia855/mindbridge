"""
URL configuration for mindbridge project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    # API endpoints
    path('api/', include('mindbridge_app.api_urls')),
    # Serve the frontend index.html as the site root
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
    path('users/', include('users.urls')),
    path('bookings/', include('bookings.urls')),
    path('posts/', include('posts.urls')),
    path('library/', include('library.urls')),
    path('events/', include('events.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    # Serve static files directly from the first STATICFILES_DIR (development only)
    try:
        urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])
    except Exception:
        # Fallback to STATIC_ROOT if STATICFILES_DIRS isn't iterable or available
        urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Admin site customization
admin.site.site_header = "MINDBRIDGE Admin"
admin.site.site_title = "MINDBRIDGE"
admin.site.index_title = "Welcome to MINDBRIDGE Administration"
