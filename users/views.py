from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .forms import StudentRegistrationForm
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.contrib.auth import get_user_model
import json


def register(request):
    """
    Student registration view.
    """
    if request.method == 'POST':
        form = StudentRegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, 'Registration successful! Welcome to MINDBRIDGE.')
            return redirect('home')
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = StudentRegistrationForm()
    return render(request, 'users/register.html', {'form': form})


def user_login(request):
    """
    User login view.
    """
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            messages.success(request, f'Welcome back, {user.first_name}!')
            return redirect('home')
        else:
            messages.error(request, 'Invalid username or password.')
    return render(request, 'users/login.html')


@login_required
def user_logout(request):
    """
    User logout view.
    """
    logout(request)
    messages.success(request, 'You have been logged out successfully.')
    return redirect('home')


@login_required
def profile(request):
    """
    User profile view.
    """
    return render(request, 'users/profile.html')


@csrf_exempt
def api_register(request):
    """Simple JSON API for registering a user (development helper).

    Expects JSON: {username, password, password2, email, first_name, last_name, role}
    Returns JSON {ok: True, role: 'student'|'wellness_team', redirect: '/'} on success
    """
    if request.method != 'POST':
        return JsonResponse({'ok': False, 'error': 'POST required'}, status=405)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'ok': False, 'error': 'Invalid JSON'}, status=400)

    username = data.get('username')
    password = data.get('password')
    password2 = data.get('password2')
    email = data.get('email')
    first_name = data.get('first_name') or ''
    last_name = data.get('last_name') or ''
    role = data.get('role', 'student')

    if not username or not password or not password2:
        return JsonResponse({'ok': False, 'error': 'username and passwords are required'}, status=400)
    if password != password2:
        return JsonResponse({'ok': False, 'error': 'passwords do not match'}, status=400)

    User = get_user_model()
    if User.objects.filter(username=username).exists():
        return JsonResponse({'ok': False, 'error': 'username already taken'}, status=400)

    user = User.objects.create_user(username=username, email=email, password=password,
                                    first_name=first_name, last_name=last_name)
    # set role if available on model
    try:
        user.role = role
        user.save()
    except Exception:
        pass

    # Log the user in (session)
    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        return JsonResponse({'ok': True, 'role': getattr(user, 'role', 'student'), 'redirect': '/'} )

    return JsonResponse({'ok': False, 'error': 'could not authenticate after registration'}, status=500)


@csrf_exempt
def api_login(request):
    """Simple JSON API for login (development helper).

    Expects JSON: {username, password}
    Returns JSON {ok: True, role: 'student'|'wellness_team', redirect: '/dashboard'} on success
    """
    if request.method != 'POST':
        return JsonResponse({'ok': False, 'error': 'POST required'}, status=405)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'ok': False, 'error': 'Invalid JSON'}, status=400)

    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return JsonResponse({'ok': False, 'error': 'username and password required'}, status=400)

    user = authenticate(request, username=username, password=password)
    if user is None:
        return JsonResponse({'ok': False, 'error': 'invalid credentials'}, status=401)

    login(request, user)
    role = getattr(user, 'role', 'student')
    # decide redirect based on role
    redirect_to = '/dashboard/' if role == 'wellness_team' else '/dashboard/'
    return JsonResponse({'ok': True, 'role': role, 'redirect': redirect_to})
