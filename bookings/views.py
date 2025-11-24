# ========== Template-based Views (keep for admin/legacy) ==========

from django.shortcuts import render
from django.contrib.auth.decorators import login_required

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
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.mail import send_mail
from .gmail_utils import send_gmail
from django.conf import settings
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from decouple import config
from .models import Booking
from .forms import BookingForm
from .serializers import BookingSerializer, BookingDetailSerializer
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
import base64
from email.mime.text import MIMEText


# ========== REST API ViewSets ==========

class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def approve(self, request, pk=None):
        booking = self.get_object()
        # Only wellness team can approve
        if not hasattr(request.user, 'is_wellness_team') or not request.user.is_wellness_team:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Generate Google Meet link
        try:
            from .google_meet import create_meet_event
            meet_data = create_meet_event(booking)
            booking.status = 'approved'
            booking.meet_link = meet_data['meet_link']
            booking.save()
        except Exception as e:
            print(f"Google Meet creation failed: {e}")
            meet_data = None

        # Send approval email and handle fallback
        if meet_data:
            try:
                student_email = booking.student.email or booking.email
                student_name = booking.student.first_name or booking.full_name or booking.student.username
                subject = 'Booking Approved - Your Session is Confirmed!'
                session_time = booking.time.strftime('%I:%M %p')
                session_date = booking.date.strftime('%B %d, %Y')
                message = f"""Hello {student_name},

Your counseling session booking has been approved!

Date: {session_date}
Time: {session_time}
Duration: 40 minutes
Type: {booking.get_session_type_display()}

Join your session using the Google Meet link below:
{booking.meet_link}

✓ Test your camera and microphone beforehand
✓ Use headphones for better audio quality
✓ Have a glass of water nearby
✓ Keep your phone on silent
✓ Be ready to share openly and honestly

IMPORTANT:
• Save this email for easy access to your meeting link
• You can also find the meeting link in your MindBridge dashboard
• If you need to cancel, please do so at least 24 hours in advance

We're looking forward to supporting you on your wellness journey!

Best regards,
The MindBridge Wellness Team
African Leadership University

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Need help? Log in to your MindBridge account or contact our wellness team.
"""
                send_gmail(student_email, subject, message)
                print(f"✓ Approval email with Google Meet link sent to {student_email}")
            except Exception as e:
                print(f"Failed to send approval email: {e}")
            return Response({
                'status': 'booking approved',
                'meet_link': meet_data['meet_link'],
                'event_id': meet_data['event_id'],
                'message': 'Booking approved! Google Meet invitation sent to student email.'
            })
        else:
            # Fallback: approve without Meet link
            print("Google Meet data was None - creation failed")
            return Response({
                'status': 'booking approved (Google Meet creation failed)',
                'message': 'Please create meeting link manually'
            })
    # ...existing code for booking_create_public...


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
