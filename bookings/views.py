from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Booking
from .forms import BookingForm
from .serializers import BookingSerializer, BookingDetailSerializer


# ========== REST API ViewSets ==========

class BookingViewSet(viewsets.ModelViewSet):
    """
    API endpoint for bookings.
    Students can only view/manage their own bookings.
    Wellness team can view/manage all bookings.
    """
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'is_wellness_team') and user.is_wellness_team:
            return Booking.objects.all()
        return Booking.objects.filter(student=user)
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return BookingDetailSerializer
        return BookingSerializer
    
    def create(self, request, *args, **kwargs):
        """Override create to add better error logging."""
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("Validation errors:", serializer.errors)
        return super().create(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a booking and delete Google Meet event."""
        booking = self.get_object()
        if booking.can_cancel():
            booking.status = 'cancelled'
            
            # Try to delete Google Calendar event
            if booking.calendar_event_id:
                try:
                    from .google_meet import delete_meet_event
                    delete_meet_event(booking.calendar_event_id)
                except Exception as e:
                    print(f"Failed to delete calendar event: {e}")
            
            booking.save()
            return Response({'status': 'booking cancelled'})
        return Response(
            {'error': 'This booking cannot be cancelled'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def approve(self, request, pk=None):
        """Approve a booking (wellness team only) and create Google Meet link."""
        if not hasattr(request.user, 'is_wellness_team') or not request.user.is_wellness_team:
            return Response(
                {'error': 'Only wellness team can approve bookings'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        booking = self.get_object()
        booking.status = 'approved'
        
        # Try to create Google Meet link
        try:
            from .google_meet import create_meet_event
            print(f"Creating Meet event for booking {booking.id}")
            meet_data = create_meet_event(booking)
            print(f"Meet data result: {meet_data}")
            
            if meet_data:
                booking.meet_link = meet_data['meet_link']
                booking.calendar_event_id = meet_data['event_id']
                booking.save()
                return Response({
                    'status': 'booking approved',
                    'meet_link': meet_data['meet_link'],
                    'calendar_link': meet_data.get('html_link', '')
                })
            else:
                # Fallback: approve without Meet link
                print("Meet data was None - creation failed")
                booking.save()
                return Response({
                    'status': 'booking approved (Meet link creation failed)',
                    'message': 'Please create meeting link manually'
                })
        except Exception as e:
            # Fallback: approve without Meet link
            print(f"Exception creating Meet link: {type(e).__name__}: {str(e)}")
            import traceback
            traceback.print_exc()
            booking.save()
            return Response({
                'status': 'booking approved (Meet link creation failed)',
                'error': str(e),
                'message': 'Please create meeting link manually'
            })
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def reject(self, request, pk=None):
        """Reject a booking (wellness team only)."""
        if not hasattr(request.user, 'is_wellness_team') or not request.user.is_wellness_team:
            return Response(
                {'error': 'Only wellness team can reject bookings'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        booking = self.get_object()
        booking.status = 'rejected'
        booking.notes = request.data.get('notes', '')
        booking.save()
        return Response({'status': 'booking rejected'})


# ========== Template-based Views (keep for admin/legacy) ==========


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
