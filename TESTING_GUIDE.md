# Testing Guide: Google Meet Integration

## Prerequisites
- ✅ Django REST Framework installed
- ✅ Google API packages installed
- ✅ Database migrations applied
- ✅ Server running at http://127.0.0.1:8000/

## 🧪 Test 1: Register & Login (5 min)

1. **Open browser:** http://127.0.0.1:8000/
2. **Click "Register"**
3. **Fill in:**
   - First Name: Test
   - Last Name: Student
   - Username: teststudent1
   - Email: test.student@alustudent.com
   - Password: TestPass123
   - Confirm Password: TestPass123
4. **Click "Create Account"**
5. **Verify:** Green toast "Account created successfully!"
6. **Verify:** You're logged in (see username in top-right)

## 🧪 Test 2: Book a Session (5 min)

1. **Click "Booking"** in navigation
2. **Verify:** Form is pre-filled with your name and email
3. **Fill in:**
   - Specialist: Select any
   - Date: Tomorrow's date
   - Time: 10:00 AM
   - Notes: "This is a test booking"
4. **Click "Book Session"**
5. **Verify:** Green toast "Session booked successfully!"

## 🧪 Test 3: View Booking (2 min)

1. **Click "Dashboard"** in navigation
2. **Verify:** See your booking with:
   - Yellow "PENDING" badge
   - Date and time formatted nicely
   - Reason and notes visible
   - "Cancel Booking" button visible
3. **Verify:** No Meet link yet (booking not approved)

## 🧪 Test 4: API Check (2 min)

1. **Open new tab:** http://127.0.0.1:8000/api/bookings/
2. **Verify:** See Django REST Framework browsable API
3. **Verify:** See your booking in the list
4. **Verify:** `meet_link` is null
5. **Verify:** `status` is "pending"

## 🧪 Test 5: Approve Booking (WITHOUT Google Meet - 3 min)

Since Google Meet setup requires credentials, let's first test approval without it:

1. **In API page:** http://127.0.0.1:8000/api/bookings/
2. **Click your booking** (should show detail view)
3. **Scroll to bottom** → Click "approve" action
4. **Click "POST"** button
5. **Verify:** Response shows status changed or error about Google credentials
6. **Go back to frontend** → Refresh dashboard
7. **Verify:** Booking status changed to "APPROVED"
8. **Verify:** See "Meeting link will be provided shortly" message

## 🧪 Test 6: Cancel Booking (2 min)

1. **In Dashboard**, find your booking
2. **Click "Cancel Booking"**
3. **Confirm** the alert
4. **Verify:** Green toast "Booking cancelled successfully"
5. **Verify:** Booking now shows "CANCELLED" status
6. **Verify:** No "Cancel Booking" button anymore

## 🧪 Test 7: Google Meet Setup (15 min)

**Only if you want to test Meet links:**

1. **Follow** `GOOGLE_MEET_SETUP.md` instructions
2. **Download credentials.json** from Google Cloud Console
3. **Place in:** `bookings/credentials.json`
4. **Create new booking**
5. **Approve via API** (browser will open for Google auth)
6. **Verify:** Meet link appears in booking!
7. **Click "Join Meeting"** → Should open Google Meet

## ✅ Expected Results

After all tests, you should have:
- [x] User registered and logged in
- [x] Booking created and visible in dashboard
- [x] Booking approval working (with or without Meet link)
- [x] Booking cancellation working
- [x] Status badges showing correct colors
- [x] API endpoints accessible and working

## 🐛 Troubleshooting

### "Please login to book a session"
- You're not logged in. Click Login or Register.

### Booking form not submitting
- Check browser console (F12) for errors
- Verify server is running
- Check Network tab for API call

### No bookings showing in dashboard
- Refresh the page
- Check browser console for errors
- Verify you're logged in as the user who created bookings

### API returns 404
- Verify URLs are correct
- Check `mindbridge_app/urls.py` includes API routes
- Restart server

### Time format error
- Currently time format may need adjustment
- API expects "HH:MM:SS" format

## 📊 Database Verification

```sql
-- Check bookings table
SELECT id, student_id, date, time, status, meet_link FROM bookings;

-- Check if meet_link column exists
DESCRIBE bookings;
```

## 🎉 Success Criteria

You've successfully integrated Google Meet if:
1. ✅ Students can book sessions
2. ✅ Bookings appear in dashboard
3. ✅ Status updates work (pending → approved)
4. ✅ Meet links generated on approval (if Google credentials configured)
5. ✅ Students can join video calls
6. ✅ Bookings can be cancelled

## 📝 Next Steps After Testing

1. **Set up Google credentials** for production Meet links
2. **Add email notifications** when bookings are approved
3. **Create wellness team dashboard** to manage bookings
4. **Add calendar integration** for students
5. **Implement remaining features** (Posts, Library, Events)
