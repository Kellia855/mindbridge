from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import Booking
from .forms import BookingForm


@login_required
def booking_list(request):
    """
    Display list of bookings.
    Students see their own bookings, wellness team sees all bookings.
    """
    if request.user.is_wellness_team:
        bookings = Booking.objects.all()
    else:
        bookings = Booking.objects.filter(student=request.user)
    
    return render(request, 'bookings/booking_list.html', {'bookings': bookings})


def booking_create_public(request):
    """
    Public booking form accessible without login.
    """
    if request.method == 'POST':
        form = BookingForm(request.POST)
        if form.is_valid():
            booking = form.save(commit=False)
            if request.user.is_authenticated:
                booking.student = request.user
                # Pre-fill from user if not provided
                if not booking.full_name:
                    booking.full_name = request.user.get_full_name() or request.user.username
                if not booking.email:
                    booking.email = request.user.email
                if not booking.phone_number and request.user.phone_number:
                    booking.phone_number = request.user.phone_number
            booking.save()
            messages.success(request, 'Booking created successfully! You will be notified once it is reviewed.')
            return redirect('home')
    else:
        form = BookingForm()
        # Pre-fill form for authenticated users
        if request.user.is_authenticated:
            form.initial = {
                'full_name': request.user.get_full_name() or request.user.username,
                'email': request.user.email,
                'phone_number': getattr(request.user, 'phone_number', '')
            }
    
    return render(request, 'bookings/booking_form.html', {'form': form})


@login_required
def create_booking(request):
    """
    Create a new booking.
    """
    if request.method == 'POST':
        form = BookingForm(request.POST)
        if form.is_valid():
            booking = form.save(commit=False)
            booking.student = request.user
            booking.save()
            messages.success(request, 'Booking created successfully! You will be notified once it is reviewed.')
            return redirect('bookings:list')
    else:
        form = BookingForm()
    
    return render(request, 'bookings/booking_form.html', {'form': form})


@login_required
def booking_detail(request, pk):
    """
    View booking details.
    """
    booking = get_object_or_404(Booking, pk=pk)
    
    # Check permissions
    if not request.user.is_wellness_team and booking.student != request.user:
        messages.error(request, 'You do not have permission to view this booking.')
        return redirect('bookings:list')
    
    return render(request, 'bookings/booking_detail.html', {'booking': booking})


@login_required
def cancel_booking(request, pk):
    """
    Cancel a booking (students only, for their own bookings).
    """
    booking = get_object_or_404(Booking, pk=pk, student=request.user)
    
    if booking.can_cancel():
        booking.status = 'cancelled'
        booking.save()
        messages.success(request, 'Booking cancelled successfully.')
    else:
        messages.error(request, 'This booking cannot be cancelled.')
    
    return redirect('bookings:list')
