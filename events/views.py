from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from datetime import date
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Event, EventRegistration
from .serializers import EventSerializer, EventRegistrationSerializer


# ========== REST API ViewSets ==========

class EventViewSet(viewsets.ModelViewSet):
    """
    API endpoint for events.
    """
    queryset = Event.objects.filter(is_active=True)
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_permissions(self):
        """
        Only wellness team can create/update/delete events.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return super().get_permissions()
    
    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def register(self, request, pk=None):
        """Register for an event."""
        event = self.get_object()
        
        if event.is_full():
            return Response(
                {'error': 'Event is full'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if EventRegistration.objects.filter(event=event, student=request.user).exists():
            return Response(
                {'error': 'Already registered for this event'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        registration = EventRegistration.objects.create(event=event, student=request.user)
        serializer = EventRegistrationSerializer(registration)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def unregister(self, request, pk=None):
        """Unregister from an event."""
        event = self.get_object()
        
        try:
            registration = EventRegistration.objects.get(event=event, student=request.user)
            registration.delete()
            return Response({'status': 'unregistered successfully'})
        except EventRegistration.DoesNotExist:
            return Response(
                {'error': 'Not registered for this event'},
                status=status.HTTP_400_BAD_REQUEST
            )


class EventRegistrationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for event registrations (read-only).
    """
    serializer_class = EventRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'is_wellness_team') and user.is_wellness_team:
            return EventRegistration.objects.all()
        return EventRegistration.objects.filter(student=user)


# ========== Template-based Views (keep for admin/legacy) ==========


def event_list(request):
    """
    Display list of active events.
    """
    upcoming_events = Event.objects.filter(is_active=True, date__gte=date.today())
    past_events = Event.objects.filter(is_active=True, date__lt=date.today())
    
    context = {
        'upcoming_events': upcoming_events,
        'past_events': past_events,
    }
    
    return render(request, 'events/event_list.html', context)


def event_detail(request, pk):
    """
    Display detailed view of an event.
    """
    event = get_object_or_404(Event, pk=pk)
    is_registered = False
    
    if request.user.is_authenticated:
        is_registered = EventRegistration.objects.filter(event=event, student=request.user).exists()
    
    context = {
        'event': event,
        'is_registered': is_registered,
    }
    
    return render(request, 'events/event_detail.html', context)


@login_required
def register_for_event(request, pk):
    """
    Register student for an event.
    """
    event = get_object_or_404(Event, pk=pk)
    
    # Check if already registered
    if EventRegistration.objects.filter(event=event, student=request.user).exists():
        messages.warning(request, 'You are already registered for this event.')
        return redirect('events:detail', pk=pk)
    
    # Check if event is full
    if event.is_full():
        messages.error(request, 'Sorry, this event is full.')
        return redirect('events:detail', pk=pk)
    
    # Create registration
    EventRegistration.objects.create(event=event, student=request.user)
    messages.success(request, f'Successfully registered for {event.title}!')
    
    return redirect('events:detail', pk=pk)


@login_required
def unregister_from_event(request, pk):
    """
    Unregister student from an event.
    """
    event = get_object_or_404(Event, pk=pk)
    
    try:
        registration = EventRegistration.objects.get(event=event, student=request.user)
        registration.delete()
        messages.success(request, 'Successfully unregistered from the event.')
    except EventRegistration.DoesNotExist:
        messages.error(request, 'You are not registered for this event.')
    
    return redirect('events:detail', pk=pk)


@login_required
def my_events(request):
    """
    Display events the user is registered for.
    """
    registrations = EventRegistration.objects.filter(student=request.user)
    return render(request, 'events/my_events.html', {'registrations': registrations})
