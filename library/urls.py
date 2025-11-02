from django.urls import path
from . import views

app_name = 'library'

urlpatterns = [
    path('', views.library_list, name='library_list'),
    path('<int:pk>/', views.book_detail, name='book_detail'),
]
