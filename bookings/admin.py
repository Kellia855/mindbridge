from django.contrib import admin
from .models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    """
    Admin interface for Booking model.
    """
    list_display = ('student', 'date', 'time', 'status', 'created_at')
    list_filter = ('status', 'date', 'created_at')
    search_fields = ('student__username', 'student__email', 'reason')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Booking Information', {
            'fields': ('student', 'date', 'time', 'reason')
        }),
        ('Status', {
            'fields': ('status', 'notes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')
    
    actions = ['approve_bookings', 'reject_bookings', 'mark_completed']
    
    def approve_bookings(self, request, queryset):
        queryset.update(status='approved')
        self.message_user(request, f"{queryset.count()} booking(s) approved.")
    approve_bookings.short_description = "Approve selected bookings"
    
    def reject_bookings(self, request, queryset):
        queryset.update(status='rejected')
        self.message_user(request, f"{queryset.count()} booking(s) rejected.")
    reject_bookings.short_description = "Reject selected bookings"
    
    def mark_completed(self, request, queryset):
        queryset.update(status='completed')
        self.message_user(request, f"{queryset.count()} booking(s) marked as completed.")
    mark_completed.short_description = "Mark as completed"
