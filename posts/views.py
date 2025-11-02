from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import Post
from .forms import PostForm


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
