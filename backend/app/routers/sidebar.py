from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from typing import List, Dict

from app.database import get_db

router = APIRouter(prefix="/api", tags=["sidebar", "support"])

# ── Schemas ─────────────────────────────────────────────────────────────────

class WaitTimeResponse(BaseModel):
    wait_time_minutes: int
    status: str

class PopularArticle(BaseModel):
    id: int
    title: Dict[str, str]
    excerpt: Dict[str, str]
    content: Dict[str, str]

class HoursResponse(BaseModel):
    hours: Dict[str, str]
    timezone: str

class TicketCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    message: str

class TicketResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: str
    message: str
    status: str = "open"

# ── Endpoints ───────────────────────────────────────────────────────────────

@router.get("/sidebar/wait-time", response_model=WaitTimeResponse)
def get_wait_time():
    """Returns the current estimated support wait time."""
    return {
        "wait_time_minutes": 3,
        "status": "Normal Call Volume"
    }

@router.get("/sidebar/popular-articles", response_model=List[PopularArticle])
def get_popular_articles():
    """Returns a list of popular help center articles in English and Amharic."""
    return [
        {
            "id": 1,
            "title": {
                "en": "How to Reset Your Account Password",
                "am": "የመለያዎን የይለፍ ቃል እንዴት ዳግም ማዋቀር እንደሚቻል"
            },
            "excerpt": {
                "en": "Follow these simple steps to recover or update your secure password.",
                "am": "ደህንነቱ የተጠበቀ የይለፍ ቃልዎን ለማግኘት ወይም ለማዘመን እነዚህን ቀላል ደረጃዎች ይከተሉ።"
            },
            "content": {
                "en": "Go to the login screen, click 'Forgot Password', enter your registered email address, and follow the link sent to your inbox.",
                "am": "ወደ መግቢያው ማያ ገጽ ይሂዱ ፣ 'የይለፍ ቃል ረስተዋል' የሚለውን ጠቅ ያድርጉ ፣ የተመዘገበበትን የኢሜል አድራሻ ያስገቡ እና ወደ ሳጥንዎ የተላከውን አገናኝ ይከተሉ።"
            }
        },
        {
            "id": 2,
            "title": {
                "en": "Online Payment & Auto-Pay Setup",
                "am": "የመስመር ላይ ክፍያ እና ራስ-ሰር ክፍያ ማዋቀር"
            },
            "excerpt": {
                "en": "Learn how to link your credit card or bank account for seamless billing.",
                "am": "ለቀላል ክፍያ የክሬዲት ካርድዎን ወይም የባንክ ሂሳብዎን እንዴት ማገናኘት እንደሚችሉ ይወቁ።"
            },
            "content": {
                "en": "Log in to the billing portal, navigate to 'Payment Methods', click 'Add New Method', and select 'Enable Auto-Pay'.",
                "am": "ወደ ክፍያ ፖርታል ይግቡ ፣ ወደ 'የክፍያ ዘዴዎች' ይሂዱ ፣ 'አዲስ ዘዴ ያክሉ' የሚለውን ጠቅ ያድርጉ እና 'ራስ-ሰር ክፍያን ያግብሩ' የሚለውን ይምረጡ።"
            }
        },
        {
            "id": 3,
            "title": {
                "en": "Troubleshooting Device Connectivity Issues",
                "am": "የመሣሪያ ግንኙነት ችግሮችን መፍታት"
            },
            "excerpt": {
                "en": "Basic troubleshooting tips for internet router or hardware connection issues.",
                "am": "ለኢንተርኔት ራውተር ወይም ለሃርድዌር ግንኙነት ችግሮች መሰረታዊ የመፍትሄ ምክሮች።"
            },
            "content": {
                "en": "Unplug your device for 30 seconds, verify all cable connections, plug it back in, and wait 2 minutes for status lights to turn green.",
                "am": "መሣሪያዎን ለ30 ሰከንድ ይንቀሉት፣ ሁሉንም የኬብል ግንኙነቶች ያረጋግጡ፣ መልሰው ይሰኩት እና የሁኔታ መብራቶች አረንጓዴ እስኪሆኑ ድረስ 2 ደቂቃ ይጠብቁ።"
            }
        }
    ]

@router.get("/sidebar/hours", response_model=HoursResponse)
def get_hours():
    """Returns business hours for English and Amharic support desks."""
    return {
        "hours": {
            "en": "Monday - Friday: 9:00 AM - 6:00 PM EST",
            "am": "ከሰኞ - አርብ፡ ከጠዋቱ 3፡00 - ማታ 12፡00 (በኢትዮጵያ አቆጣጠር)"
        },
        "timezone": "EST / East Africa Time"
    }

# Temporary mock database storage for submitted support tickets
TICKETS_DB = []

@router.post("/support/tickets", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
def submit_support_ticket(ticket: TicketCreate):
    """Submits a support request form ticket."""
    new_id = len(TICKETS_DB) + 1
    ticket_entry = {
        "id": new_id,
        "name": ticket.name,
        "email": ticket.email,
        "phone": ticket.phone,
        "message": ticket.message,
        "status": "open"
      }
    TICKETS_DB.append(ticket_entry)
    return ticket_entry
