import datetime
import logging
from app.calendar.auth import get_calendar_service

logger = logging.getLogger("app.calendar.availability")

# Working hours configuration (IST: UTC+5:30)
# Slots matching the frontend booking times
WORK_SLOTS = [
    "10:00", "11:30", "13:00", "15:00", "16:30", "18:00"
]

def get_available_slots() -> list[str]:
    """Retrieve available meeting slots for the next 7 days.
    
    If Google Calendar service is available, it queries the freebusy API to
    determine which working slots are unbooked. Otherwise, it returns a list
    of mock slots.
    
    Returns:
        List of slot strings formatted as 'YYYY-MM-DD HH:MM'
    """
    service = get_calendar_service()
    
    # Calculate search range: starting from today (or tomorrow) for 7 days
    now = datetime.datetime.now(datetime.timezone.utc)
    # Start checking from tomorrow morning
    start_date = (now + datetime.timedelta(days=1)).date()
    end_date = start_date + datetime.timedelta(days=7)
    
    if service is None:
        logger.info("Running in Mock Mode. Generating static available slots.")
        # Generate mock weekday slots starting from 2026-06-10 as requested
        # June 10, 2026 is Wednesday
        # Let's return June 10th and 11th slots
        return [
            "2026-06-10 11:00",
            "2026-06-10 15:00",
            "2026-06-11 10:00",
            "2026-06-11 13:00",
            "2026-06-11 16:30",
            "2026-06-12 11:30",
            "2026-06-12 15:00"
        ]

    try:
        # Define start/end ISO times for freebusy check
        time_min = datetime.datetime.combine(start_date, datetime.time(0, 0)).isoformat() + "Z"
        time_max = datetime.datetime.combine(end_date, datetime.time(23, 59)).isoformat() + "Z"
        
        body = {
            "timeMin": time_min,
            "timeMax": time_max,
            "items": [{"id": "primary"}]
        }
        
        logger.info(f"Querying Google Calendar freebusy from {time_min} to {time_max}...")
        free_busy_res = service.freebusy().query(body=body).execute()
        busy_periods = free_busy_res.get("calendars", {}).get("primary", {}).get("busy", [])
        
        available_slots = []
        
        # Iterate day-by-day
        current_date = start_date
        while current_date <= end_date:
            # Check if it is a weekday (0 = Monday, 4 = Friday, 5 = Saturday, 6 = Sunday)
            if current_date.weekday() < 5:
                for time_str in WORK_SLOTS:
                    hour, minute = map(int, time_str.split(":"))
                    # Parse slot as naive local, then construct start/end in local timezone (IST)
                    # For simplicity, let's treat the server time or UTC representation correctly.
                    # We can construct the slot datetime:
                    slot_dt = datetime.datetime.combine(current_date, datetime.time(hour, minute))
                    
                    # Assume IST timezone (UTC + 5:30)
                    ist_tz = datetime.timezone(datetime.timedelta(hours=5, minutes=30))
                    slot_dt_tz = slot_dt.replace(tzinfo=ist_tz)
                    slot_end_tz = slot_dt_tz + datetime.timedelta(hours=1) # 1 hour duration
                    
                    # Check if slot overlaps with any busy period
                    overlapping = False
                    for busy in busy_periods:
                        # Parse ISO busy times (e.g. '2026-06-10T11:00:00Z')
                        busy_start = datetime.datetime.fromisoformat(busy["start"].replace("Z", "+00:00"))
                        busy_end = datetime.datetime.fromisoformat(busy["end"].replace("Z", "+00:00"))
                        
                        # Check overlap: (StartA < EndB) and (EndA > StartB)
                        if slot_dt_tz < busy_end and slot_end_tz > busy_start:
                            overlapping = True
                            break
                            
                    if not overlapping:
                        available_slots.append(slot_dt.strftime("%Y-%m-%d %H:%M"))
                        
            current_date += datetime.timedelta(days=1)
            
        logger.info(f"Retrieved {len(available_slots)} available slots from real Google Calendar API.")
        return available_slots
        
    except Exception as e:
        logger.error(f"Error querying Google Calendar freebusy: {e}. Falling back to mock slots.")
        return [
            "2026-06-10 11:00",
            "2026-06-10 15:00",
            "2026-06-11 10:00",
            "2026-06-11 13:00",
            "2026-06-12 11:30"
        ]
