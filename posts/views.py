from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Post
from .forms import PostForm
from .serializers import PostSerializer


# ========== REST API ViewSets ==========

class PostViewSet(viewsets.ModelViewSet):
    """
    API endpoint for posts (stories).
    Only approved posts are visible to all users.
    Users can create posts, wellness team can approve/reject.
    """
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and hasattr(user, 'is_wellness_team') and user.is_wellness_team:
            # Wellness team sees all posts
            return Post.objects.all()
        elif user.is_authenticated:
            # Authenticated users see approved posts + their own posts
            return Post.objects.filter(is_approved=True) | Post.objects.filter(author=user)
        else:
            # Anonymous users see only approved posts
            return Post.objects.filter(is_approved=True)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def approve(self, request, pk=None):
        """Approve a post (wellness team only)."""
        if not hasattr(request.user, 'is_wellness_team') or not request.user.is_wellness_team:
            return Response(
                {'error': 'Only wellness team can approve posts'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        post = self.get_object()
        post.is_approved = True
        post.save()
        return Response({'status': 'post approved'})
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def reject(self, request, pk=None):
        """Reject a post (wellness team only)."""
        if not hasattr(request.user, 'is_wellness_team') or not request.user.is_wellness_team:
            return Response(
                {'error': 'Only wellness team can reject posts'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        post = self.get_object()
        post.is_approved = False
        post.save()
        return Response({'status': 'post rejected'})


# ========== Template-based Views (keep for admin/legacy) ==========


def post_list(request):
    """
    Display list of approved posts.
    """
    posts = Post.objects.filter(is_approved=True)
    return render(request, 'posts/post_list.html', {'posts': posts})


@login_required
def create_post(request):
    """
    Create a new post.
    """
    if request.method == 'POST':
        form = PostForm(request.POST)
        if form.is_valid():
            post = form.save(commit=False)
            post.author = request.user
            post.save()
            messages.success(request, 'Your post has been submitted and is awaiting approval from the wellness team.')
            return redirect('posts:list')
    else:
        form = PostForm()
    
    return render(request, 'posts/post_form.html', {'form': form})


@login_required
def my_posts(request):
    """
    Display user's own posts (both approved and pending).
    """
    posts = Post.objects.filter(author=request.user)
    return render(request, 'posts/my_posts.html', {'posts': posts})


@login_required
def delete_post(request, pk):
    """
    Delete a post (only if user is the author).
    """
    post = get_object_or_404(Post, pk=pk, author=request.user)
    
    if request.method == 'POST':
        post.delete()
        messages.success(request, 'Post deleted successfully.')
        return redirect('posts:my_posts')
    
    return render(request, 'posts/post_confirm_delete.html', {'post': post})
