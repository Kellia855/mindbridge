from django.urls import path
from . import views

app_name = 'events'

urlpatterns = [
    path('', views.event_list, name='event_list'),
    path('<int:pk>/', views.event_detail, name='event_detail'),
    path('<int:pk>/register/', views.register_for_event, name='event_register'),
    path('<int:pk>/unregister/', views.unregister_from_event, name='event_unregister'),
    path('my-events/', views.my_events, name='my_events'),
]
