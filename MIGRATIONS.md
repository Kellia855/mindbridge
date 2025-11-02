# Migration Guide for Updated Models

## After making the model changes, you need to create and apply migrations:

### Step 1: Make Migrations

```powershell
python manage.py makemigrations bookings
python manage.py makemigrations users
python manage.py makemigrations posts
python manage.py makemigrations library
python manage.py makemigrations events
```

### Step 2: Apply Migrations

```powershell
python manage.py migrate
```

## If you encounter issues:

### Fresh Database Setup (Recommended for Development)

If this is a new setup or you can reset the database:

```powershell
# 1. Drop and recreate database in MySQL
```sql
DROP DATABASE IF EXISTS mindbridge_db;
CREATE DATABASE mindbridge_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

# 2. Delete all migration files EXCEPT __init__.py
# In each app folder (bookings, users, posts, library, events):
# Delete files in migrations folder (but keep __init__.py)

# 3. Make fresh migrations
python manage.py makemigrations
python manage.py migrate

# 4. Create superuser
python manage.py createsuperuser
```

### Update Existing Database

If you have existing data you want to keep:

```powershell
# 1. Make migrations with default values
python manage.py makemigrations

# When prompted about new fields:
# - For full_name: Choose option 1 and provide default ''
# - For email: Choose option 1 and provide default ''
# - For phone_number: Choose option 1 and provide default ''
# - For session_type: Choose option 1 and provide default 'individual'
# - For additional_notes: Choose option 1 and provide default ''

# 2. Apply migrations
python manage.py migrate
```

## Model Changes Made

### Bookings Model
Added fields:
- `full_name` - CharField for booking name
- `email` - EmailField for contact
- `phone_number` - CharField for phone
- `session_type` - CharField with choices (individual, group, crisis, consultation)
- `additional_notes` - TextField for extra information

### All Other Models
No changes required, they're already correctly set up.

## After Migration

Test the changes:

```python
# Open Django shell
python manage.py shell

# Test creating a booking
from users.models import User
from bookings.models import Booking
from datetime import date, time

# Get or create a user
user = User.objects.first()

# Create a booking with new fields
booking = Booking.objects.create(
    student=user,
    full_name="Test Student",
    email="test@example.com",
    phone_number="+250788123456",
    date=date.today(),
    time=time(14, 0),
    session_type='individual',
    reason="Test booking",
    additional_notes="This is a test"
)

print(f"Booking created: {booking}")
```

## Troubleshooting

### Error: No such table

**Solution**: Run migrations
```powershell
python manage.py migrate
```

### Error: Column does not exist

**Solution**: Make sure migrations are created and applied
```powershell
python manage.py makemigrations
python manage.py migrate
```

### Error: Duplicate column

**Solution**: Check if migration already exists
```powershell
python manage.py showmigrations
```

## Verification

After migrations, verify in Django admin:

1. Run server: `python manage.py runserver`
2. Go to http://127.0.0.1:8000/admin/
3. Click on Bookings
4. Click "Add Booking"
5. You should see all the new fields

---

**Note**: Always backup your database before making structural changes!
