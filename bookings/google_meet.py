"""
Google Meet Integration for MindBridge
Handles Google Calendar API and Meet link generation
"""
import os
import datetime
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# If modifying these scopes, delete the token.json file
SCOPES = ['https://www.googleapis.com/auth/calendar']


def get_calendar_service():
    """
    Get authenticated Google Calendar service.
    Returns the Calendar API service object.
    """
    creds = None
    token_path = os.path.join(os.path.dirname(__file__), 'token.json')
    credentials_path = os.path.join(os.path.dirname(__file__), 'credentials.json')
    
    # The file token.json stores the user's access and refresh tokens
    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)
    
    # If there are no (valid) credentials available, let the user log in
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(credentials_path):
                raise FileNotFoundError(
                    "credentials.json not found. Please download it from Google Cloud Console."
                )
            flow = InstalledAppFlow.from_client_secrets_file(credentials_path, SCOPES)
            creds = flow.run_local_server(port=0)
        
        # Save the credentials for the next run
        with open(token_path, 'w') as token:
            token.write(creds.to_json())
    
    return build('calendar', 'v3', credentials=creds)


def create_meet_event(booking):
    """
    Create a Google Calendar event with Google Meet link for a booking.
    
    Args:
        booking: Booking model instance
        
    Returns:
        dict: Contains 'meet_link' and 'event_id'
    """
    try:
        service = get_calendar_service()
        
        # Combine date and time
        start_datetime = datetime.datetime.combine(booking.date, booking.time)
        # Assume 1 hour session duration
        end_datetime = start_datetime + datetime.timedelta(hours=1)
        
        # Format for RFC3339
        start_time = start_datetime.isoformat()
        end_time = end_datetime.isoformat()
        
        # Get student name
        student_name = booking.student.get_full_name() or booking.student.username
        
        # Create event
        event = {
            'summary': f'MindBridge Counseling Session - {student_name}',
            'description': f'''
MindBridge Counseling Session

Student: {student_name}
Email: {booking.email or booking.student.email}
Phone: {booking.phone_number or 'N/A'}
Session Type: {booking.get_session_type_display()}
Reason: {booking.reason}

Additional Notes:
{booking.additional_notes or 'None'}
            '''.strip(),
            'start': {
                'dateTime': start_time,
                'timeZone': 'Africa/Kigali',  # Adjust to your timezone
            },
            'end': {
                'dateTime': end_time,
                'timeZone': 'Africa/Kigali',
            },
            'attendees': [
                {'email': booking.email or booking.student.email},
            ],
            'conferenceData': {
                'createRequest': {
                    'requestId': f'mindbridge-{booking.id}',
                    'conferenceSolutionKey': {
                        'type': 'hangoutsMeet'
                    }
                }
            },
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'email', 'minutes': 24 * 60},  # 1 day before
                    {'method': 'popup', 'minutes': 30},  # 30 minutes before
                ],
            },
        }
        
        # Create the event
        event = service.events().insert(
            calendarId='primary',
            body=event,
            conferenceDataVersion=1,
            sendUpdates='all'  # Send email notifications
        ).execute()
        
        # Extract Meet link
        meet_link = event.get('hangoutLink', '')
        event_id = event.get('id', '')
        
        return {
            'meet_link': meet_link,
            'event_id': event_id,
            'html_link': event.get('htmlLink', '')
        }
        
    except HttpError as error:
        print(f'An error occurred: {error}')
        return None
    except FileNotFoundError as e:
        print(f'Setup error: {e}')
        return None


def update_meet_event(booking):
    """
    Update an existing Google Calendar event.
    
    Args:
        booking: Booking model instance with calendar_event_id
        
    Returns:
        bool: True if successful, False otherwise
    """
    if not booking.calendar_event_id:
        return False
    
    try:
        service = get_calendar_service()
        
        # Get existing event
        event = service.events().get(
            calendarId='primary',
            eventId=booking.calendar_event_id
        ).execute()
        
        # Update date/time if changed
        start_datetime = datetime.datetime.combine(booking.date, booking.time)
        end_datetime = start_datetime + datetime.timedelta(hours=1)
        
        event['start']['dateTime'] = start_datetime.isoformat()
        event['end']['dateTime'] = end_datetime.isoformat()
        
        # Update the event
        service.events().update(
            calendarId='primary',
            eventId=booking.calendar_event_id,
            body=event,
            sendUpdates='all'
        ).execute()
        
        return True
        
    except HttpError as error:
        print(f'An error occurred: {error}')
        return False


def delete_meet_event(calendar_event_id):
    """
    Delete a Google Calendar event.
    
    Args:
        calendar_event_id: Google Calendar event ID
        
    Returns:
        bool: True if successful, False otherwise
    """
    if not calendar_event_id:
        return False
    
    try:
        service = get_calendar_service()
        service.events().delete(
            calendarId='primary',
            eventId=calendar_event_id,
            sendUpdates='all'
        ).execute()
        return True
        
    except HttpError as error:
        print(f'An error occurred: {error}')
        return False
