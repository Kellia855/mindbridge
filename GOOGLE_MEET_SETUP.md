# Google Meet Integration Setup Guide

## Prerequisites
- Google Account (preferably Google Workspace for education)
- Python packages installed

## Step 1: Install Required Packages

```bash
pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
```

## Step 2: Set Up Google Cloud Project

1. **Go to Google Cloud Console:** https://console.cloud.google.com/

2. **Create a new project:**
   - Click "Select a project" → "New Project"
   - Name: "MindBridge"
   - Click "Create"

3. **Enable Google Calendar API:**
   - Go to "APIs & Services" → "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

4. **Create OAuth 2.0 Credentials:**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - If prompted, configure OAuth consent screen:
     - User Type: External (or Internal if you have Workspace)
     - App name: "MindBridge Wellness Platform"
     - User support email: your email
     - Authorized domains: (leave empty for now)
     - Scopes: Add `calendar` scope
     - Test users: Add your email and counselor emails
   - Application type: "Desktop app"
   - Name: "MindBridge Desktop Client"
   - Click "Create"

5. **Download credentials:**
   - Click the download button (⬇️) next to your OAuth 2.0 Client ID
   - Rename the downloaded file to `credentials.json`
   - Move it to: `bookings/credentials.json`

## Step 3: First-Time Authentication

Run the server and trigger first booking approval:

```bash
python3 manage.py runserver
```

When a wellness team member first approves a booking:
1. A browser window will open
2. Sign in with your Google account (use the wellness team's Google Workspace account)
3. Grant calendar permissions
4. A `token.json` file will be created automatically in `bookings/`

**Important:** Keep `credentials.json` and `token.json` secure and add them to `.gitignore`!

## Step 4: Add to .gitignore

```
# Google API credentials
bookings/credentials.json
bookings/token.json
```

## Step 5: Run Migrations

```bash
python3 manage.py makemigrations bookings
python3 manage.py migrate
```

## Step 6: Test the Integration

1. Log in as a student
2. Create a booking
3. Log in as wellness team member
4. Approve the booking via API: 
   - Go to http://127.0.0.1:8000/api/bookings/{id}/approve/
   - Click "POST"
5. Check the response - you should see a `meet_link`!
6. Open Google Calendar - you should see the event with Meet link

## How It Works

1. **Student books session** → Status: "pending"
2. **Wellness team approves** → Automatically:
   - Creates Google Calendar event
   - Generates Google Meet link
   - Sends calendar invite to student's email
   - Stores meet_link and calendar_event_id in database
3. **Student receives**:
   - Email notification with calendar invite
   - Meet link visible in booking details
4. **On session day** → Both click Meet link to join

## Timezone Configuration

Edit `bookings/google_meet.py` line 63-64 to set your timezone:

```python
'timeZone': 'Africa/Kigali',  # Change to your timezone
```

Common timezones:
- East Africa: `Africa/Kigali`, `Africa/Nairobi`
- West Africa: `Africa/Lagos`
- South Africa: `Africa/Johannesburg`
- UTC: `UTC`

## Troubleshooting

### "credentials.json not found"
- Make sure you downloaded the credentials file from Google Cloud Console
- Place it in `bookings/credentials.json`

### "Access blocked: This app's request is invalid"
- Make sure you configured the OAuth consent screen
- Add test users in Google Cloud Console

### "Calendar API has not been enabled"
- Enable Google Calendar API in Google Cloud Console
- Wait a few minutes for propagation

### Meet link not created
- Check terminal for error messages
- Verify the Google account has Calendar access
- Make sure token.json was created successfully

## Security Notes

⚠️ **Never commit credentials.json or token.json to version control!**
⚠️ Use environment variables for production deployment
⚠️ Restrict API key usage in Google Cloud Console
⚠️ Use service accounts for production (more secure than OAuth)

## Future Enhancements

- [ ] Email notifications with Meet link
- [ ] SMS reminders before sessions
- [ ] Meeting recording options
- [ ] Waiting room features
- [ ] Multiple counselor calendars
- [ ] Automatic timezone detection
