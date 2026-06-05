import os
import logging

# Set up logging
logger = logging.getLogger("app.calendar.auth")

try:
    from googleapiclient.discovery import build
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request
    GOOGLE_CALENDAR_SDK_AVAILABLE = True
except ImportError:
    GOOGLE_CALENDAR_SDK_AVAILABLE = False
    logger.warning("Google Calendar SDK packages not installed. Calendar tool will run in mock fallback mode.")

# Paths for OAuth credentials (placed in backend/ root directory)
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
CREDENTIALS_PATH = os.path.join(BASE_DIR, "credentials.json")
TOKEN_PATH = os.path.join(BASE_DIR, "token.json")

def get_calendar_service():
    """Authenticate and build the Google Calendar API service client.
    
    Returns:
        Resource: Google Calendar service client or None if running in mock mode.
    """
    if not GOOGLE_CALENDAR_SDK_AVAILABLE:
        logger.info("Calendar service running in MOCK mode (SDK missing).")
        return None
        
    creds = None
    # token.json stores user's access and refresh tokens, created automatically after first authorization
    if os.path.exists(TOKEN_PATH):
        try:
            creds = Credentials.from_authorized_user_file(TOKEN_PATH, ["https://www.googleapis.com/auth/calendar"])
        except Exception as e:
            logger.error(f"Error loading token.json: {e}")

    # If there are no valid credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except Exception as e:
                logger.error(f"Error refreshing access token: {e}")
                creds = None
        else:
            if not os.path.exists(CREDENTIALS_PATH):
                logger.warning(
                    f"Google Calendar credentials.json not found at {CREDENTIALS_PATH}. "
                    "Calendar tool will run in mock fallback mode. "
                    "To use real Google Calendar, download OAuth credentials.json from Google Cloud Console."
                )
                return None

            try:
                flow = InstalledAppFlow.from_client_secrets_file(
                    CREDENTIALS_PATH,
                    ["https://www.googleapis.com/auth/calendar"]
                )
                creds = flow.run_local_server(port=0)
            except Exception as e:
                logger.error(f"Error authenticating with credentials.json: {e}")
                return None

        # Save the credentials for the next run
        try:
            with open(TOKEN_PATH, "w") as token:
                token.write(creds.to_json())
        except Exception as e:
            logger.error(f"Error saving token.json: {e}")

    if creds:
        try:
            service = build("calendar", "v3", credentials=creds)
            logger.info("Successfully authenticated and built Google Calendar service client.")
            return service
        except Exception as e:
            logger.error(f"Failed to build Google Calendar service client: {e}")
            
    return None
