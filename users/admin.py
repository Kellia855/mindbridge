from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """
    Custom admin interface for User model.
    """
    list_display = ('username', 'email', 'personal_email', 'first_name', 'last_name', 'role', 'student_id', 'is_active')
    list_filter = ('role', 'is_active', 'is_staff', 'created_at')
    search_fields = ('username', 'email', 'personal_email', 'first_name', 'last_name', 'student_id')
    ordering = ('-created_at',)
    
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('role', 'phone_number', 'student_id', 'personal_email')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )
    
    readonly_fields = ('created_at', 'updated_at')
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('role', 'phone_number', 'student_id', 'personal_email', 'email', 'first_name', 'last_name')}),
    )
