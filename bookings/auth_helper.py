"""
Helper script to authenticate Google Calendar API from Windows.
Run this once to create token.json, then the server can use it.
"""
import os
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ['https://www.googleapis.com/auth/calendar']

def authenticate():
    """Run OAuth flow to create token.json"""
    credentials_path = os.path.join(os.path.dirname(__file__), 'credentials.json')
    token_path = os.path.join(os.path.dirname(__file__), 'token.json')
    
    if not os.path.exists(credentials_path):
        print(f"Error: credentials.json not found at {credentials_path}")
        return
    
    print("Starting OAuth flow...")
    print("A browser window will open. Please sign in and grant permissions.")
    
    flow = InstalledAppFlow.from_client_secrets_file(credentials_path, SCOPES)
    creds = flow.run_local_server(port=0)
    
    # Save the credentials
    with open(token_path, 'w') as token:
        token.write(creds.to_json())
    
    print(f"✅ Success! Token saved to {token_path}")
    print("You can now approve bookings and they will generate Meet links!")

if __name__ == '__main__':
    authenticate()
