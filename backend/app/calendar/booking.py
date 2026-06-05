import datetime
import logging
from app.calendar.auth import get_calendar_service

logger = logging.getLogger("app.calendar.booking")

def create_event(title: str, start: str, end: str, attendee_email: str) -> dict:
    """Create a calendar event on Google Calendar.
    
    If Google Calendar service is available, it inserts a real event.
    Otherwise, it logs the event details and returns a mock confirmation.
    
    Args:
        title: Title of the meeting
        start: Start time string 'YYYY-MM-DD HH:MM'
        end: End time string 'YYYY-MM-DD HH:MM'
        attendee_email: Email of the attendee
        
    Returns:
        Dict detailing the created event status and metadata
    """
    service = get_calendar_service()
    
    # Parse start and end time strings to datetime objects
    # Handle both 'YYYY-MM-DD HH:MM' and ISO formats
    try:
        if "T" in start:
            start_dt = datetime.datetime.fromisoformat(start.replace("Z", ""))
        else:
            start_dt = datetime.datetime.strptime(start, "%Y-%m-%d %H:%M")
            
        if "T" in end:
            end_dt = datetime.datetime.fromisoformat(end.replace("Z", ""))
        else:
            end_dt = datetime.datetime.strptime(end, "%Y-%m-%d %H:%M")
    except Exception as e:
        logger.error(f"Error parsing date strings {start} / {end}: {e}")
        # Fallback to current time + 1 hour if parse fails
        start_dt = datetime.datetime.now() + datetime.timedelta(days=1)
        end_dt = start_dt + datetime.timedelta(hours=1)

    # Assume IST timezone (Asia/Kolkata)
    ist_tz = datetime.timezone(datetime.timedelta(hours=5, minutes=30))
    start_dt_tz = start_dt.replace(tzinfo=ist_tz)
    end_dt_tz = end_dt.replace(tzinfo=ist_tz)

    start_iso = start_dt_tz.isoformat()
    end_iso = end_dt_tz.isoformat()

    if service is None:
        logger.info(
            f"MOCK BOOKING SUCCESSFUL: Created event '{title}' from {start_iso} to {end_iso} "
            f"with attendee {attendee_email}."
        )
        return {
            "status": "confirmed",
            "mock": True,
            "id": "mock-event-id-12345",
            "summary": title,
            "start": start_iso,
            "end": end_iso,
            "attendee": attendee_email,
            "htmlLink": "https://calendar.google.com/calendar/r/event"
        }

    try:
        event_body = {
            "summary": title,
            "description": "Briefing scheduled via Shaaz AI Candidate Representative chatbot.",
            "start": {
                "dateTime": start_iso,
                "timeZone": "Asia/Kolkata",
            },
            "end": {
                "dateTime": end_iso,
                "timeZone": "Asia/Kolkata",
            },
            "attendees": [
                {"email": attendee_email},
            ],
            "reminders": {
                "useDefault": True,
            }
        }
        
        logger.info(f"Inserting event into primary calendar: {event_body}")
        created_event = service.events().insert(calendarId="primary", body=event_body).execute()
        logger.info(f"Successfully created Google Calendar event. Event ID: {created_event.get('id')}")
        
        return {
            "status": "confirmed",
            "mock": False,
            "id": created_event.get("id"),
            "summary": created_event.get("summary"),
            "start": created_event.get("start", {}).get("dateTime"),
            "end": created_event.get("end", {}).get("dateTime"),
            "attendee": attendee_email,
            "htmlLink": created_event.get("htmlLink")
        }
        
    except Exception as e:
        logger.error(f"Error creating Google Calendar event: {e}. Falling back to mock confirmation.")
        return {
            "status": "confirmed",
            "mock": True,
            "error": str(e),
            "id": "fallback-mock-event-id",
            "summary": title,
            "start": start_iso,
            "end": end_iso,
            "attendee": attendee_email,
            "htmlLink": "https://calendar.google.com/calendar/r/event"
        }
