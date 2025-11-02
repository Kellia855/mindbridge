from django.urls import path
from . import views

app_name = 'posts'

urlpatterns = [
    path('', views.post_list, name='post_list'),
    path('create/', views.create_post, name='post_create'),
    path('my-posts/', views.my_posts, name='my_posts'),
    path('<int:pk>/delete/', views.delete_post, name='post_delete'),
]
