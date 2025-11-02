from django.db import models


class LibraryBook(models.Model):
    """
    Model for books in the digital library.
    """
    CATEGORY_CHOICES = (
        ('psychology', 'Psychology'),
        ('self_help', 'Self Help'),
        ('mental_health', 'Mental Health'),
        ('wellbeing', 'Wellbeing'),
        ('mindfulness', 'Mindfulness'),
        ('other', 'Other'),
    )
    
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='other')
    cover_image = models.ImageField(upload_to='library/covers/', blank=True, null=True)
    pdf_file = models.FileField(upload_to='library/pdfs/', blank=True, null=True)
    external_link = models.URLField(blank=True, null=True, help_text="External link to book resource")
    isbn = models.CharField(max_length=13, blank=True, null=True)
    published_year = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'library_books'
        verbose_name = 'Library Book'
        verbose_name_plural = 'Library Books'
        ordering = ['title']
    
    def __str__(self):
        return f"{self.title} by {self.author}"
    
    def has_pdf(self):
        """Check if book has PDF file."""
        return bool(self.pdf_file)
    
    def has_link(self):
        """Check if book has external link."""
        return bool(self.external_link)
