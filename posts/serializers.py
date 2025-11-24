from rest_framework import serializers
from .models import Post


class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = Post
        fields = ['id', 'author', 'author_name', 'content', 'category', 'category_display', 'anonymous', 'is_approved', 'created_at', 'updated_at']
        read_only_fields = ['author', 'is_approved', 'created_at', 'updated_at']
    
    def get_author_name(self, obj):
        return obj.get_display_name()
    
    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)
