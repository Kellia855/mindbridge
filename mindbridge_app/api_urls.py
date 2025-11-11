"""
API URL Configuration for MINDBRIDGE REST API
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from bookings.views import BookingViewSet
from posts.views import PostViewSet
from library.views import LibraryBookViewSet
from events.views import EventViewSet, EventRegistrationViewSet

# Create router and register viewsets
router = DefaultRouter()
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'posts', PostViewSet, basename='post')
router.register(r'library', LibraryBookViewSet, basename='library')
router.register(r'events', EventViewSet, basename='event')
router.register(r'event-registrations', EventRegistrationViewSet, basename='event-registration')

urlpatterns = [
    path('', include(router.urls)),
]
