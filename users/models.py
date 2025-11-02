from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User model for MINDBRIDGE platform.
    Extends Django's AbstractUser to add role-based permissions.
    """
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('wellness_team', 'Wellness Team'),
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    student_id = models.CharField(max_length=20, blank=True, null=True, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    @property
    def is_wellness_team(self):
        return self.role == 'wellness_team'
    
    @property
    def is_student(self):
        return self.role == 'student'
