from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from datetime import date
from .models import Event, EventRegistration


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
