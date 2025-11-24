from django.db import models
from django.conf import settings


class Booking(models.Model):
    """
    Model for counseling session bookings.
    """
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    
    SESSION_TYPE_CHOICES = (
        ('individual', 'Individual Counseling'),
        ('group', 'Group Therapy'),
        ('crisis', 'Crisis Support'),
        ('consultation', 'General Consultation'),
    )
    
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='bookings'
    )
    full_name = models.CharField(max_length=200, blank=True)
    email = models.EmailField(blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    date = models.DateField()
    time = models.TimeField()
    session_type = models.CharField(max_length=20, choices=SESSION_TYPE_CHOICES, default='individual')
    reason = models.TextField(help_text="Brief description of reason for booking")
    additional_notes = models.TextField(blank=True, null=True, help_text="Any additional information")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True, null=True, help_text="Admin notes")
    # Video meeting integration fields
    meet_link = models.URLField(blank=True, null=True, help_text="Video call link (Zoom/Google Meet)")
    meeting_id = models.CharField(max_length=255, blank=True, null=True, help_text="Zoom meeting ID")
    calendar_event_id = models.CharField(max_length=255, blank=True, null=True, help_text="Google Calendar event ID (legacy)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'bookings'
        verbose_name = 'Booking'
        verbose_name_plural = 'Bookings'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.student.username} - {self.date} at {self.time} ({self.status})"
    
    def can_cancel(self):
        """Check if booking can be cancelled by student."""
        return self.status in ['pending', 'approved']
