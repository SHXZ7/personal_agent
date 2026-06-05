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
    import json
    
    # 1. Try loading user credentials token from environment variable (preferred for production/Vercel)
    google_token_json = os.environ.get("GOOGLE_TOKEN_JSON")
    if google_token_json:
        try:
            info = json.loads(google_token_json)
            creds = Credentials.from_authorized_user_info(info, ["https://www.googleapis.com/auth/calendar"])
            logger.info("Loaded Google Calendar credentials from GOOGLE_TOKEN_JSON environment variable.")
        except Exception as e:
            logger.error(f"Error loading credentials from GOOGLE_TOKEN_JSON env var: {e}")

    # Fallback to local token.json file
    if not creds and os.path.exists(TOKEN_PATH):
        try:
            creds = Credentials.from_authorized_user_file(TOKEN_PATH, ["https://www.googleapis.com/auth/calendar"])
            logger.info("Loaded Google Calendar credentials from token.json file.")
        except Exception as e:
            logger.error(f"Error loading token.json: {e}")

    # If there are no valid credentials available, refresh or start flow
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
                # Try saving refreshed credentials to local token.json if writable
                if not google_token_json:
                    try:
                        with open(TOKEN_PATH, "w") as token:
                            token.write(creds.to_json())
                    except Exception as e:
                        logger.warning(f"Could not save refreshed token to disk (typical on serverless): {e}")
            except Exception as e:
                logger.error(f"Error refreshing access token: {e}")
                creds = None
        else:
            # Load Client Secrets Configuration
            google_creds_json = os.environ.get("GOOGLE_CREDENTIALS_JSON")
            
            if not google_creds_json and not os.path.exists(CREDENTIALS_PATH):
                logger.warning(
                    f"Google Calendar credentials.json not found at {CREDENTIALS_PATH} and GOOGLE_CREDENTIALS_JSON env var is missing. "
                    "Calendar tool will run in mock fallback mode."
                )
                return None

            try:
                if google_creds_json:
                    client_config = json.loads(google_creds_json)
                    flow = InstalledAppFlow.from_client_config(
                        client_config,
                        ["https://www.googleapis.com/auth/calendar"]
                    )
                else:
                    flow = InstalledAppFlow.from_client_secrets_file(
                        CREDENTIALS_PATH,
                        ["https://www.googleapis.com/auth/calendar"]
                    )
                
                # run_local_server will fail in serverless/headless environments
                creds = flow.run_local_server(port=0)
            except Exception as e:
                logger.error(f"Error running Google OAuth flow: {e}. Note: interactive auth cannot run in headless/serverless deployments.")
                return None

        # Save the credentials for the next run if we successfully ran the flow
        if creds and not google_token_json:
            try:
                with open(TOKEN_PATH, "w") as token:
                    token.write(creds.to_json())
            except Exception as e:
                logger.warning(f"Error saving token.json: {e}")

    if creds:
        try:
            service = build("calendar", "v3", credentials=creds)
            logger.info("Successfully authenticated and built Google Calendar service client.")
            return service
        except Exception as e:
            logger.error(f"Failed to build Google Calendar service client: {e}")
            
    return None
