from django import forms
from .models import Booking
from datetime import date


class BookingForm(forms.ModelForm):
    """
    Form for creating and editing bookings.
    """
    full_name = forms.CharField(
        max_length=200,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Your full name'})
    )
    email = forms.EmailField(
        widget=forms.EmailInput(attrs={'class': 'form-control', 'placeholder': 'your.email@example.com'})
    )
    phone_number = forms.CharField(
        max_length=20,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': '+250 788 123 456'})
    )
    date = forms.DateField(
        widget=forms.DateInput(attrs={'type': 'date', 'class': 'form-control', 'min': date.today().isoformat()})
    )
    time = forms.TimeField(
        widget=forms.TimeInput(attrs={'type': 'time', 'class': 'form-control'})
    )
    session_type = forms.ChoiceField(
        choices=Booking.SESSION_TYPE_CHOICES,
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    reason = forms.CharField(
        widget=forms.Textarea(attrs={'class': 'form-control', 'rows': 4, 'placeholder': 'Please describe the reason for your booking...'})
    )
    additional_notes = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'Any additional information you would like to share...'})
    )
    
    class Meta:
        model = Booking
        fields = ['full_name', 'email', 'phone_number', 'date', 'time', 'session_type', 'reason', 'additional_notes']
    
    def clean_date(self):
        booking_date = self.cleaned_data.get('date')
        if booking_date and booking_date < date.today():
            raise forms.ValidationError("Cannot book sessions in the past.")
        return booking_date
