# MINDBRIDGE - Quick Start Guide

## 🚀 Get Started in 5 Minutes!

This guide will help you get the MINDBRIDGE platform running on your local machine quickly.

## Prerequisites

- ✅ Python 3.8+ installed
- ✅ MySQL Server installed and running
- ✅ PowerShell (Windows) or Terminal (Mac/Linux)

## Installation Steps

### Step 1: Navigate to Project Directory

```powershell
cd c:\Users\USER\OneDrive\Documents\mindbridge
```

### Step 2: Run the Setup Script (Windows)

```powershell
.\setup.ps1
```

**Or manually follow these steps:**

### Step 2a: Create Virtual Environment

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### Step 2b: Install Dependencies

```powershell
pip install -r requirements.txt
```

### Step 3: Configure Environment

Create a `.env` file in the project root:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
DB_NAME=mindbridge_db
DB_USER=root
DB_PASSWORD=your-mysql-password
DB_HOST=localhost
DB_PORT=3306
```

### Step 4: Create Database

Open MySQL and run:

```sql
CREATE DATABASE mindbridge_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 5: Run Migrations

```powershell
python manage.py makemigrations
python manage.py migrate
```

### Step 6: Create Admin User

```powershell
python manage.py createsuperuser
```

Follow the prompts to create your admin account.

### Step 7: Collect Static Files

```powershell
python manage.py collectstatic --noinput
```

### Step 8: Start the Server

```powershell
python manage.py runserver
```

### Step 9: Access the Application

Open your browser and visit:

- **Homepage**: http://127.0.0.1:8000/
- **Admin Panel**: http://127.0.0.1:8000/admin/

## 🎉 You're All Set!

### What to do next:

1. **Login** with your superuser account
2. **Explore** the homepage and features
3. **Create a booking** to test the system
4. **Access admin panel** to manage bookings

## 📁 Project Structure

```
mindbridge/
├── bookings/          # Booking management
├── events/            # Events system
├── library/           # Digital library
├── posts/             # Community posts
├── users/             # User authentication
├── templates/         # HTML templates
│   ├── base.html
│   ├── home.html
│   └── ...
├── static/            # CSS, JS, images
│   ├── css/style.css
│   └── js/main.js
└── manage.py
```

## 🎨 Key Features Implemented

### ✅ Frontend
- **Responsive homepage** with all sections from the design
- **Navigation bar** with user authentication
- **Booking form** with validation
- **Login/Register pages** with modern design
- **Smooth animations** and transitions
- **Mobile-friendly** responsive layout

### ✅ Backend
- **User authentication** system
- **Booking management** with status tracking
- **Database models** for all features
- **Admin panel** configuration
- **Form validation** and error handling

## 🔧 Common Commands

### Run Server
```powershell
python manage.py runserver
```

### Create Migrations
```powershell
python manage.py makemigrations
```

### Apply Migrations
```powershell
python manage.py migrate
```

### Create Superuser
```powershell
python manage.py createsuperuser
```

### Django Shell
```powershell
python manage.py shell
```

## 🎨 Customization

### Change Colors

Edit `static/css/style.css` and modify the CSS variables:

```css
:root {
    --primary-color: #1e3a8a;
    --secondary-color: #3b82f6;
    --accent-red: #ef4444;
    --accent-green: #10b981;
}
```

### Add New Pages

1. Create view in `app_name/views.py`
2. Add URL in `app_name/urls.py`
3. Create template in `templates/app_name/`

## 🐛 Troubleshooting

### Database Connection Error

**Problem**: Can't connect to MySQL

**Solution**:
- Verify MySQL is running
- Check credentials in `.env` file
- Ensure database exists

### Static Files Not Loading

**Problem**: CSS/JS not appearing

**Solution**:
```powershell
python manage.py collectstatic --noinput
```

### Migration Errors

**Problem**: Migration conflicts

**Solution**:
```powershell
python manage.py makemigrations --merge
python manage.py migrate
```

### Port Already in Use

**Problem**: Port 8000 is busy

**Solution**:
```powershell
python manage.py runserver 8080
```

## 📚 Additional Resources

### Learn Django
- Official Django Documentation: https://docs.djangoproject.com/
- Django Tutorial: https://www.djangoproject.com/start/

### Frontend Resources
- Font Awesome Icons: https://fontawesome.com/icons
- CSS Tricks: https://css-tricks.com/
- MDN Web Docs: https://developer.mozilla.org/

## 🤝 Need Help?

If you encounter any issues:

1. Check the full README.md for detailed documentation
2. Review the error message carefully
3. Search for the error online
4. Ask your team members
5. Check Django documentation

## 🎯 Testing the Application

### Test User Registration
1. Go to http://127.0.0.1:8000/
2. Click "Register"
3. Fill in the form
4. Login with new credentials

### Test Booking System
1. Login as a student
2. Click "Book a Session"
3. Fill in the booking form
4. Submit and view in "My Bookings"

### Test Admin Panel
1. Go to http://127.0.0.1:8000/admin/
2. Login with superuser credentials
3. View and manage bookings
4. Approve/reject bookings

## 🚀 Next Steps

After getting the basic setup running:

1. **Populate data**: Add sample books, events, posts
2. **Test features**: Try all functionalities
3. **Customize design**: Match your brand colors
4. **Add content**: Upload library resources
5. **Create events**: Schedule wellness activities

## ✨ Features Overview

### 🏠 Homepage
- Hero section with call-to-action
- Services overview
- Meet specialists section
- Community stories
- Privacy information

### 📅 Booking System
- Easy session scheduling
- Multiple session types
- Status tracking
- Email notifications

### 📚 Library
- Browse resources
- Filter by category
- Download PDFs
- External links

### 👥 Community
- Anonymous posting
- Story sharing
- Moderation system

### 📆 Events
- Upcoming events
- Registration system
- Attendance tracking

## 🎉 Congratulations!

You've successfully set up MINDBRIDGE! 

Start exploring and building amazing features for student mental wellness! 🧠💙

---

**Happy Coding!** 🚀

For detailed information, see the full [README.md](README.md)
