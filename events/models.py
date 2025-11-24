from django.db import models
from django.conf import settings


class Event(models.Model):
    """
    Model for wellness events.
    """
    title = models.CharField(max_length=200)
    description = models.TextField()
    date = models.DateField()
    time = models.TimeField(help_text="Event start time (kept for backward compatibility)")
    start_time = models.TimeField(null=True, blank=True, help_text="Event start time")
    end_time = models.TimeField(null=True, blank=True, help_text="Event end time")
    location = models.CharField(max_length=200)
    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='organized_events'
    )
    max_participants = models.IntegerField(default=50, help_text="Maximum number of participants")
    image = models.ImageField(upload_to='events/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'events'
        verbose_name = 'Event'
        verbose_name_plural = 'Events'
        ordering = ['date', 'time']
    
    def __str__(self):
        return f"{self.title} - {self.date}"
    
    def get_registered_count(self):
        """Get number of registered participants."""
        return self.registrations.count()
    
    def is_full(self):
        """Check if event is at capacity."""
        return self.get_registered_count() >= self.max_participants
    
    def spots_remaining(self):
        """Calculate remaining spots."""
        return self.max_participants - self.get_registered_count()


class EventRegistration(models.Model):
    """
    Model for event registrations.
    """
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='event_registrations')
    registered_at = models.DateTimeField(auto_now_add=True)
    attended = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'event_registrations'
        verbose_name = 'Event Registration'
        verbose_name_plural = 'Event Registrations'
        unique_together = ('event', 'student')
        ordering = ['-registered_at']
    
    def __str__(self):
        return f"{self.student.username} - {self.event.title}"
