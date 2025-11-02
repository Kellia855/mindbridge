from django import forms
from .models import Post


class PostForm(forms.ModelForm):
    """
    Form for creating posts.
    """
    content = forms.CharField(
        widget=forms.Textarea(attrs={
            'class': 'form-control',
            'rows': 6,
            'placeholder': 'Share your story, journey, or thoughts... This is a safe space.'
        })
    )
    anonymous = forms.BooleanField(
        required=False,
        initial=True,
        widget=forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        label='Post anonymously'
    )
    
    class Meta:
        model = Post
        fields = ['content', 'anonymous']
