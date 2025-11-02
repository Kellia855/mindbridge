from django.contrib import admin
from .models import LibraryBook


@admin.register(LibraryBook)
class LibraryBookAdmin(admin.ModelAdmin):
    """
    Admin interface for LibraryBook model.
    """
    list_display = ('title', 'author', 'category', 'published_year', 'has_pdf', 'has_link', 'created_at')
    list_filter = ('category', 'published_year', 'created_at')
    search_fields = ('title', 'author', 'description', 'isbn')
    ordering = ('title',)
    
    fieldsets = (
        ('Book Information', {
            'fields': ('title', 'author', 'description', 'category', 'isbn', 'published_year')
        }),
        ('Resources', {
            'fields': ('cover_image', 'pdf_file', 'external_link')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')
