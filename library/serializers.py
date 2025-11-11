from rest_framework import serializers
from .models import LibraryBook


class LibraryBookSerializer(serializers.ModelSerializer):
    has_pdf = serializers.BooleanField(read_only=True)
    has_link = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = LibraryBook
        fields = [
            'id', 'title', 'author', 'description', 'category',
            'cover_image', 'pdf_file', 'external_link', 
            'isbn', 'published_year', 'has_pdf', 'has_link',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
