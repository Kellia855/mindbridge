from django.db import models
from django.conf import settings


class Post(models.Model):
    """
    Model for anonymous posts in the virtual safe space.
    """
    CATEGORY_CHOICES = [
        ('overcoming_anxiety', 'Overcoming Anxiety'),
        ('academic_stress', 'Academic Stress'),
        ('personal_growth', 'Personal Growth'),
        ('relationships', 'Relationships'),
        ('self_care', 'Self Care'),
        ('general_inspiration', 'General Inspiration'),
    ]
    
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='posts'
    )
    content = models.TextField()
    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES,
        default='general_inspiration',
        help_text="Story category"
    )
    anonymous = models.BooleanField(default=True, help_text="Display this post anonymously")
    is_approved = models.BooleanField(default=False, help_text="Must be approved by wellness team")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'posts'
        verbose_name = 'Post'
        verbose_name_plural = 'Posts'
        ordering = ['-created_at']
    
    def __str__(self):
        author_name = "Anonymous" if self.anonymous else self.author.username
        return f"{author_name} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"
    
    def get_display_name(self):
        """Return display name for the post."""
        return "Anonymous" if self.anonymous else self.author.get_full_name() or self.author.username
