# MINDBRIDGE - Digital Wellness Platform for ALU Students

## Project Overview

MINDBRIDGE is a comprehensive digital wellness platform designed specifically for African Leadership University students, providing a safe, interactive environment for mental health support, self-expression, and access to wellness resources.

---

## Project Structure

```
mindbridge/
├── manage.py
├── MIGRATIONS.md
├── README.md
├── requirements.txt
├── bookings/
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── forms.py
│   ├── models.py
│   ├── urls.py
│   └── views.py
├── events/
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── models.py
│   ├── urls.py
│   └── views.py
├── frontend/
│   ├── index.html
├── library/
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── models.py
│   ├── urls.py
│   └── views.py
├── mindbrige_app/
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── posts/
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── forms.py
│   ├── models.py
│   ├── urls.py
│   └── views.py
├── users/
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── forms.py
│   ├── models.py
│   ├── urls.py
│   └── views.py
```

---

## Quick Start Guide

### Prerequisites

- Python 3.8 or higher
- MySQL 5.7 or higher
- Git

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-team/mindbridge.git
cd mindbridge
```

### Step 2: Create Virtual Environment

```bash
# On macOS/Linux
python3 -m venv venv
source venv/bin/activate

# On Windows
python -m venv venv
venv\Scripts\activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

Create `requirements.txt` with:
```
Django==4.2.7
mysqlclient==2.2.0
python-decouple==3.8
Pillow==10.1.0
```

### Step 4: Setup Environment Variables

Create a `.env` file in the project root:

```env
SECRET_KEY=your-super-secret-key-change-this-in-production
DEBUG=True
DB_NAME=mindbridge_db
DB_USER=your_user
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
DB_PORT=3306
```

** Important:** Generate a secure SECRET_KEY for production:
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### Step 5: Setup MySQL Database

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE mindbridge_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create user (optional, for production)
CREATE USER 'mindbridge_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON mindbridge_db.* TO 'mindbridge_user'@'localhost';
FLUSH PRIVILEGES;

# Exit MySQL
exit;
```

### Step 6: Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### Step 7: Create Superuser

```bash
python manage.py createsuperuser
```

Follow prompts to create an admin account.

### Step 8: Create Static Directories

```bash
mkdir static media
mkdir media/library media/events
mkdir media/library/covers media/library/pdfs
```

### Step 9: Collect Static Files

```bash
python manage.py collectstatic --noinput
```

### Step 10: Run Development Server

```bash
python manage.py runserver
```

Visit: `http://127.0.0.1:8000`

---

## Team Workflow

### Frontend Team (3 Members)

**Responsibilities:**
- Create and style HTML templates
- Implement responsive designs using Tailwind CSS
- Add JavaScript interactions
- Ensure accessibility and mobile responsiveness

**Key Files to Work On:**
- `templates/` directory
- `static/` directory (CSS, JS, images)
- Form styling and validation
- User experience enhancements

**Tasks Distribution:**
- **Member 1:** Homepage, navigation, footer
- **Member 2:** Booking and event pages
- **Member 3:** Library, posts, and profile pages

### Backend Team (4 Members)

**Responsibilities:**
- Implement models and database schema
- Create views and business logic
- Handle form processing and validation
- Configure admin panel
- Write API endpoints (future)

**Key Files to Work On:**
- `models.py` files in each app
- `views.py` files in each app
- `forms.py` files in each app
- `admin.py` files in each app

**Tasks Distribution:**
- **Member 1:** Users app (authentication, profiles)
- **Member 2:** Bookings app (CRUD operations, status management)
- **Member 3:** Posts and Library apps (content management)
- **Member 4:** Events app (registration system, calendar)

---

## Core Features

### 1. Virtual Booking System

**Functionality:**
- Students book counseling sessions
- Select date, time, and provide reason
- Track booking status (pending, approved, rejected, completed, cancelled)
- Wellness team manages bookings via admin panel

**User Flow:**
1. Student logs in
2. Navigates to Bookings
3. Clicks "New Booking"
4. Fills form (date, time, reason)
5. Submits for approval
6. Receives notification on status change

**Admin Flow:**
1. Wellness team logs into admin panel
2. Views all bookings
3. Updates status and adds notes
4. Student receives notification

### 2. Anonymous Posting (Safe Space)

**Functionality:**
- Students share stories anonymously
- Posts require approval before display
- Only content and timestamp shown
- Moderation by wellness team

**User Flow:**
1. Student navigates to Safe Space
2. Clicks "Share Your Story"
3. Writes content
4. Chooses anonymous or identified
5. Submits for moderation
6. Appears after approval

### 3. Digital Library

**Functionality:**
- Browse mental health and self-help books
- Filter by category
- Search by title or author
- Download PDFs or access external links

**Content Categories:**
- Psychology
- Self Help
- Mental Health
- Wellbeing
- Mindfulness

### 4. Event Calendar

**Functionality:**
- Wellness team creates events
- Students register for events
- View upcoming and past events
- Track attendance

**Event Types:**
- Mental health awareness sessions
- Wellness workshops
- Support group meetings
- Health screenings

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(150) UNIQUE NOT NULL,
    email VARCHAR(254) UNIQUE NOT NULL,
    password VARCHAR(128) NOT NULL,
    first_name VARCHAR(150),
    last_name VARCHAR(150),
    role ENUM('student', 'wellness_team') DEFAULT 'student',
    phone_number VARCHAR(15),
    student_id VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Bookings Table
```sql
CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'completed', 'cancelled') DEFAULT 'pending',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Posts Table
```sql
CREATE TABLE posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    author_id INT NOT NULL,
    content TEXT NOT NULL,
    anonymous BOOLEAN DEFAULT TRUE,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Library Books Table
```sql
CREATE TABLE library_books (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category ENUM('psychology', 'self_help', 'mental_health', 'wellbeing', 'mindfulness', 'other') DEFAULT 'other',
    cover_image VARCHAR(255),
    pdf_file VARCHAR(255),
    external_link VARCHAR(200),
    isbn VARCHAR(13),
    published_year INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Events Table
```sql
CREATE TABLE events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    location VARCHAR(200) NOT NULL,
    organizer_id INT,
    max_participants INT,
    image VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE SET NULL
);
```

### Event Registrations Table
```sql
CREATE TABLE event_registrations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    student_id INT NOT NULL,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    attended BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_registration (event_id, student_id)
);
```

---

## User Roles & Permissions

### Student Role
**Permissions:**
- Create and manage own bookings
- Create anonymous posts
- View approved posts
- Access digital library
- Register for events
- View own profile

### Wellness Team Role
**Permissions:**
- All student permissions except booking sessions
- Update booking status
- Approve/reject posts
- Create and manage events
- Access admin panel
- View analytics (future)

---

## Development Commands

### Create New App
```bash
python manage.py startapp app_name
```

### Make Migrations
```bash
python manage.py makemigrations
python manage.py makemigrations app_name  # Specific app
```

### Apply Migrations
```bash
python manage.py migrate
python manage.py migrate app_name  # Specific app
```

### Create Superuser
```bash
python manage.py createsuperuser
```

### Run Development Server
```bash
python manage.py runserver
python manage.py runserver 0.0.0.0:8000  # Access from network
```

### Django Shell
```bash
python manage.py shell
```

### Collect Static Files
```bash
python manage.py collectstatic
```

### Run Tests
```bash
python manage.py test
python manage.py test app_name  # Specific app
```

---

## Git Workflow

### Branch Naming Convention
- `feature/feature-name` - New features
- `bugfix/bug-description` - Bug fixes
- `hotfix/critical-fix` - Critical fixes
- `enhancement/description` - Improvements

### Commit Message Convention
```
type: subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Example:**
```bash
git commit -m "feat: add booking cancellation feature

Added ability for students to cancel their own bookings
if status is pending or approved

Closes #23"
```

### Workflow Steps

1. **Create Branch**
```bash
git checkout -b feature/booking-cancellation
```

2. **Make Changes & Commit**
```bash
git add .
git commit -m "feat: add booking cancellation"
```

3. **Push to Remote**
```bash
git push origin feature/booking-cancellation
```

4. **Create Pull Request**
- Go to GitHub
- Create PR from feature branch to main
- Request review from team lead
- Address feedback
- Merge after approval

5. **Update Local Main**
```bash
git checkout main
git pull origin main
```

---

## Deployment Guide

### Option 1: PythonAnywhere

1. **Create Account**
   - Go to pythonanywhere.com
   - Sign up for account

2. **Upload Code**
```bash
git clone https://github.com/your-team/mindbridge.git
cd mindbridge
```

3. **Setup Virtual Environment**
```bash
mkvirtualenv mindbridge --python=/usr/bin/python3.10
pip install -r requirements.txt
```

4. **Configure Database**
- Create MySQL database in PythonAnywhere
- Update .env file

5. **Run Migrations**
```bash
python manage.py migrate
python manage.py collectstatic
```

6. **Configure Web App**
- Set source code path
- Set virtualenv path
- Update WSGI file

### Option 2: Render

1. **Create Account** at render.com

2. **Create Web Service**
- Connect GitHub repository
- Select Python environment

3. **Configure Environment**
```
Build Command: pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
Start Command: gunicorn mindbridge.wsgi:application
```

4. **Add Environment Variables**
- Set all variables from .env file
- Set DEBUG=False

5. **Create Database**
- Create MySQL database on Render
- Link to web service

---

## Testing

### Create Test File
```python
# bookings/tests.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import Booking
from datetime import date, time

User = get_user_model()

class BookingModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='teststudent',
            email='test@example.com',
            password='testpass123',
            role='student'
        )
    
    def test_create_booking(self):
        booking = Booking.objects.create(
            student=self.user,
            date=date.today(),
            time=time(14, 30),
            reason='Need counseling session',
            status='pending'
        )
        self.assertEqual(booking.status, 'pending')
        self.assertEqual(str(booking), 
                        f"{self.user.username} - {date.today()} at 14:30:00 (pending)")
```

### Run Tests
```bash
python manage.py test
```

---

## Future Enhancements

### Phase 2 Features
1. **AI Mood Tracker**
   - Daily mood logging
   - Sentiment analysis
   - Personalized recommendations

2. **Chatbot Support**
   - 24/7 automated support
   - FAQ responses
   - Crisis detection

3. **Mobile App**
   - React Native or Flutter
   - Offline access

4. **Analytics Dashboard**
   - Usage statistics
   - Trending topics
   - Impact metrics

5. **Peer Support Matching**
   - Connect students with similar experiences
   - Moderated peer groups

### Technical Improvements
- Caching with Redis
- Rate limiting

---

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

## Acknowledgments

- African Leadership University
- ALU Wellness Team
- All contributors and maintainers

---

**Built with & for ALU Students**
