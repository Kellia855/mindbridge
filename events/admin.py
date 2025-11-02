from django.contrib import admin
from .models import Event, EventRegistration


class EventRegistrationInline(admin.TabularInline):
    """
    Inline admin for event registrations.
    """
    model = EventRegistration
    extra = 0
    readonly_fields = ('registered_at',)


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    """
    Admin interface for Event model.
    """
    list_display = ('title', 'date', 'time', 'location', 'get_registered_count', 'max_participants', 'is_active')
    list_filter = ('is_active', 'date', 'created_at')
    search_fields = ('title', 'description', 'location')
    ordering = ('-date',)
    inlines = [EventRegistrationInline]
    
    fieldsets = (
        ('Event Information', {
            'fields': ('title', 'description', 'date', 'time', 'location', 'organizer')
        }),
        ('Settings', {
            'fields': ('max_participants', 'image', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')


@admin.register(EventRegistration)
class EventRegistrationAdmin(admin.ModelAdmin):
    """
    Admin interface for EventRegistration model.
    """
    list_display = ('student', 'event', 'registered_at', 'attended')
    list_filter = ('attended', 'registered_at', 'event')
    search_fields = ('student__username', 'event__title')
    ordering = ('-registered_at',)
