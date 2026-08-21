from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Optional

router = APIRouter(prefix="/api", tags=["content"])

# ── Schemas ─────────────────────────────────────────────────────────────────

class StatusBannerResponse(BaseModel):
    active: bool
    type: str  # "maintenance", "incident", or "info"
    message: Dict[str, str]  # locale map (en, am, etc.)
    expires_at: Optional[str] = None

class FaqEntry(BaseModel):
    id: int
    question: Dict[str, str]
    answer: Dict[str, str]
    category: str  # "General", "Billing", "Technical", "Account"

class TrustBadge(BaseModel):
    id: str
    label: str
    description: str

class TrustMetricsResponse(BaseModel):
    rating: float
    reviews: int
    fcr_pct: int
    badges: List[TrustBadge]

class ContactChannel(BaseModel):
    id: str
    type: str  # "email", "chat", "location", "phone"
    label: Dict[str, str]
    detail: Dict[str, str]
    href: str
    icon_key: str

# ── Endpoints ───────────────────────────────────────────────────────────────

@router.get("/status/banner", response_model=StatusBannerResponse)
def get_status_banner():
    """Returns the current active system status notification or maintenance banner."""
    return {
        "active": True,
        "type": "maintenance",
        "message": {
            "en": "Scheduled system maintenance will occur this Sunday from 2:00 AM to 4:00 AM EST. Some digital services may experience brief interruptions.",
            "am": "የታቀደ የነፃ ስርዓት ጥገና በዚህ እሁድ ከጠዋቱ 8:00 እስከ 10:00 ሰዓት (በኢትዮጵያ አቆጣጠር) ይከናወናል ። አንዳንድ ዲጂታል አገልግሎቶች ለአጭር ጊዜ ሊቋረጡ ይችላሉ።"
        },
        "expires_at": "2026-08-23T09:00:00Z"
    }

@router.get("/faq", response_model=List[FaqEntry])
def get_faqs():
    """Returns a list of frequently asked questions for Visual IVR visitors."""
    return [
        {
            "id": 1,
            "category": "General",
            "question": {
                "en": "What is Visual IVR and how does it work?",
                "am": "ቪዥዋል IVR ምንድን ነው እና እንዴት ነው የሚሰራው?"
            },
            "answer": {
                "en": "Visual IVR turns traditional voice-guided menus into a visual, click-through portal on your smartphone or web browser. You can navigate options, read solutions instantly, play text-to-speech audio, or request a direct callback without waiting on hold.",
                "am": "ቪዥዋል IVR የድሮውን የድምፅ ምናሌ ወደ ቪዥዋል ጠቅ ማድረጊያ ገጽ ይቀይረዋል። በስልክዎ ወይም በኮምፒተርዎ አማራጮችን መምረጥ፣ መፍትሄዎችን ማንበብ፣ የድምፅ መልእክቶችን ማዳመጥ ወይም ሳይጠብቁ ወዲያውኑ መልሶ መደወል መጠይቅ ይችላሉ።"
            }
        },
        {
            "id": 2,
            "category": "Billing",
            "question": {
                "en": "Can I pay my bills directly through the Visual IVR?",
                "am": "ክፍያዎችን በቀጥታ በቪዥዋል IVR መክፈል እችላለሁ?"
            },
            "answer": {
                "en": "Yes. Select 'Billing and Payments' from the visual menu. From there, you can view instructions or navigate to the secure payment page to link credit cards or bank accounts.",
                "am": "አዎ። ከምናሌው ላይ 'ክፍያ እና ሂሳብ' የሚለውን ይምረጡ። ከዚያ መመሪያዎቹን ማየት ወይም ክሬዲት ካርድ/ባንክ አካውንት ለማገናኘት ወደ ደህንነቱ የተጠበቀ ክፍያ መሄድ ይችላሉ።"
            }
        },
        {
            "id": 3,
            "category": "Technical",
            "question": {
                "en": "What should I do if my connection times out or fails?",
                "am": "ግንኙነቱ ሲቋረጥ ወይም ሳይሳካ ሲቀር ምን ማድረግ አለብኝ?"
            },
            "answer": {
                "en": "If you experience network issues, verify your internet router connection or restart your device. The system also includes a Retry button to refresh your current menu node dynamically.",
                "am": "የኔትወርክ ችግር ካጋጠመዎት ራውተርዎን ያረጋግጡ ወይም መሣሪያዎን ያጥፉና ያብሩ። በተጨማሪም አሁን ያሉበትን ምናሌ ለማደስ 'Retry' የሚለውን ቁልፍ መጫን ይችላሉ።"
            }
        },
        {
            "id": 4,
            "category": "Account",
            "question": {
                "en": "Do I need to sign in to use the support portal?",
                "am": "ድጋፍ ሰጪውን ለመጠቀም መግባት ያስፈልገኛል?"
            },
            "answer": {
                "en": "No, you can navigate menus and request support tickets as a Guest. Signing in with an account allows you to view past tickets and receive real-time updates directly in the notification panel.",
                "am": "አያስፈልግም። እንደ እንግዳ ሆነው ምናሌዎችን መመልከት እና የድጋፍ ቅጽ መላክ ይችላሉ። በኦፊሴላዊ መለያዎ ሲገቡ ግን የድሮ ቲኬቶችዎን ለማየት እና በስልክዎ ላይ ማንቂያዎችን ለማግኘት ይረዳዎታል።"
            }
        }
    ]

@router.get("/trust-metrics", response_model=TrustMetricsResponse)
def get_trust_metrics():
    """Returns quarterly compliance, satisfaction, and performance metrics."""
    return {
        "rating": 4.85,
        "reviews": 12450,
        "fcr_pct": 91,
        "badges": [
            {
                "id": "soc2",
                "label": "SOC 2 Type II",
                "description": "Certified security and data privacy standards"
            },
            {
                "id": "gdpr",
                "label": "GDPR Compliant",
                "description": "Full alignment with data protection regulations"
            },
            {
                "id": "hipaa",
                "label": "HIPAA Ready",
                "description": "Secure safeguarding of protected health information"
            }
        ]
    }

@router.get("/contact-channels", response_model=List[ContactChannel])
def get_contact_channels():
    """Returns official contact channels outside of the IVR system."""
    return [
        {
            "id": "email",
            "type": "email",
            "label": {
                "en": "Email Support",
                "am": "በኢሜል ያግኙን"
            },
            "detail": {
                "en": "Receive a detailed response in under 12 hours from our dedicated agents.",
                "am": "ከድጋፍ ሰጪዎቻችን በ12 ሰዓት ውስጥ ዝርዝር ምላሽ በኢሜል ያግኙ።"
            },
            "href": "mailto:support@visualivr.com",
            "icon_key": "email"
        },
        {
            "id": "messaging",
            "type": "chat",
            "label": {
                "en": "Secure Messaging",
                "am": "ደህንነቱ የተጠበቀ መልዕክት"
            },
            "detail": {
                "en": "Connect instantly via WhatsApp or SMS channels on your cellular network.",
                "am": "በዋትስአፕ (WhatsApp) ወይም በኤስኤምኤስ (SMS) ፈጣን ግንኙነት ያድርጉ።"
            },
            "href": "https://wa.me/1234567890",
            "icon_key": "chat"
        },
        {
            "id": "branch",
            "type": "location",
            "label": {
                "en": "Locate a Branch",
                "am": "ቅርንጫፍ ይፈልጉ"
            },
            "detail": {
                "en": "Find physical offices or self-service payment kiosk locations near you.",
                "am": "በአቅራቢያዎ የሚገኙ የክፍያ ማሽኖችን ወይም ቅርንጫፍ ቢሮዎችን ያግኙ።"
            },
            "href": "/locations",
            "icon_key": "location"
        }
    ]
