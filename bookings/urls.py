from django.urls import path
from . import views

app_name = 'bookings'

urlpatterns = [ 
    path('', views.booking_list, name='booking_list'),
    path('create/', views.create_booking, name='booking_create'),
    path('<int:pk>/', views.booking_detail, name='booking_detail'),
    path('<int:pk>/cancel/', views.cancel_booking, name='booking_cancel'),
]
