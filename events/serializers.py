from rest_framework import serializers
from .models import Event, EventRegistration


class EventSerializer(serializers.ModelSerializer):
    organizer_name = serializers.SerializerMethodField()
    registered_count = serializers.IntegerField(source='get_registered_count', read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    spots_remaining = serializers.IntegerField(read_only=True)
    is_registered = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'date', 'time', 'start_time', 'end_time', 'location',
            'organizer', 'organizer_name', 'max_participants', 
            'registered_count', 'is_full', 'spots_remaining',
            'image', 'is_active', 'is_registered',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['organizer', 'created_at', 'updated_at']
    
    def get_organizer_name(self, obj):
        if obj.organizer:
            return obj.organizer.get_full_name() or obj.organizer.username
        return 'Unknown'
    
    def get_is_registered(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return EventRegistration.objects.filter(event=obj, student=request.user).exists()
        return False


class EventRegistrationSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source='event.title', read_only=True)
    student_name = serializers.SerializerMethodField()
    
    class Meta:
        model = EventRegistration
        fields = ['id', 'event', 'event_title', 'student', 'student_name', 'registered_at', 'attended']
        read_only_fields = ['student', 'registered_at']
    
    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}".strip() or obj.student.username
    
    def create(self, validated_data):
        validated_data['student'] = self.context['request'].user
        return super().create(validated_data)
