from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from rest_framework import viewsets, permissions, filters
from .models import LibraryBook
from .serializers import LibraryBookSerializer


# ========== REST API ViewSets ==========

class LibraryBookViewSet(viewsets.ModelViewSet):
    """
    API endpoint for library books.
    Read-only for students, full CRUD for wellness team.
    """
    queryset = LibraryBook.objects.all()
    serializer_class = LibraryBookSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'author', 'description', 'category']
    ordering_fields = ['title', 'author', 'created_at']
    ordering = ['title']
    
    def get_permissions(self):
        """
        Only wellness team can create/update/delete books.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return super().get_permissions()
    
    def perform_create(self, serializer):
        # Only wellness team can create books
        if hasattr(self.request.user, 'is_wellness_team') and self.request.user.is_wellness_team:
            serializer.save()
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only wellness team can add books")


# ========== Template-based Views (keep for admin/legacy) ==========


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
