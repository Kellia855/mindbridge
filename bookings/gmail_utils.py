import base64
from email.mime.text import MIMEText
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
import os

# Assumes token.json is in the same directory and contains the correct scopes
TOKEN_PATH = os.path.join(os.path.dirname(__file__), 'token.json')

# You may need to adjust the scopes and credentials loading for your project
SCOPES = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/calendar.events'
]

def send_gmail(to, subject, message_text):
    creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
    service = build('gmail', 'v1', credentials=creds)
    message = MIMEText(message_text)
    message['to'] = to
    message['subject'] = subject
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    body = {'raw': raw}
    try:
        service.users().messages().send(userId='me', body=body).execute()
        print(f"Email sent to {to}")
    except Exception as e:
        print(f"Failed to send email: {e}")
