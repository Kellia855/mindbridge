from rest_framework import serializers
from .models import Booking
from django.contrib.auth import get_user_model

User = get_user_model()


class BookingSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source='student.username', read_only=True)
    student_name = serializers.SerializerMethodField()
    student = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = Booking
        fields = [
            'id', 'student', 'student_username', 'student_name',
            'full_name', 'email', 'phone_number', 
            'date', 'time', 'session_type', 'reason', 
            'additional_notes', 'status', 'notes',
            'meet_link', 'calendar_event_id',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'student', 'student_username', 'student_name', 'status', 'notes', 'meet_link', 'calendar_event_id', 'created_at', 'updated_at']
    
    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}".strip() or obj.student.username
    
    def create(self, validated_data):
        # Set student from request user
        validated_data['student'] = self.context['request'].user
        return super().create(validated_data)


class BookingDetailSerializer(BookingSerializer):
    """Detailed serializer for single booking view."""
    pass
