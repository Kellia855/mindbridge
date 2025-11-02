from django.contrib import admin
from .models import Post


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    """
    Admin interface for Post model.
    """
    list_display = ('get_display_name', 'content_preview', 'anonymous', 'is_approved', 'created_at')
    list_filter = ('is_approved', 'anonymous', 'created_at')
    search_fields = ('content', 'author__username')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Post Information', {
            'fields': ('author', 'content', 'anonymous')
        }),
        ('Moderation', {
            'fields': ('is_approved',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')
    
    actions = ['approve_posts', 'unapprove_posts']
    
    def get_display_name(self, obj):
        return obj.get_display_name()
    get_display_name.short_description = 'Author'
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'
    
    def approve_posts(self, request, queryset):
        queryset.update(is_approved=True)
        self.message_user(request, f"{queryset.count()} post(s) approved.")
    approve_posts.short_description = "Approve selected posts"
    
    def unapprove_posts(self, request, queryset):
        queryset.update(is_approved=False)
        self.message_user(request, f"{queryset.count()} post(s) unapproved.")
    unapprove_posts.short_description = "Unapprove selected posts"
