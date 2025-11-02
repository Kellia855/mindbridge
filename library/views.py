from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from .models import LibraryBook


@login_required
def library_list(request):
    """
    Display list of library books with optional category filtering.
    """
    category = request.GET.get('category')
    search = request.GET.get('search')
    
    books = LibraryBook.objects.all()
    
    if category:
        books = books.filter(category=category)
    
    if search:
        books = books.filter(title__icontains=search) | books.filter(author__icontains=search)
    
    categories = LibraryBook.CATEGORY_CHOICES
    
    context = {
        'books': books,
        'categories': categories,
        'selected_category': category,
        'search_query': search,
    }
    
    return render(request, 'library/library_list.html', context)


@login_required
def book_detail(request, pk):
    """
    Display detailed view of a book.
    """
    book = get_object_or_404(LibraryBook, pk=pk)
    return render(request, 'library/book_detail.html', {'book': book})
