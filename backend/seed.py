import sys
from sqlalchemy.orm import Session
from app.database import SessionLocal, Base, engine
from app.models import AdminUser, MenuNode, ActionType, AdminRole
from app.auth import hash_password

def seed_db():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        # Check if we already have an admin
        existing_admin = db.query(AdminUser).filter(AdminUser.email == "admin@visualivr.com").first()
        if not existing_admin:
            print("Creating default admin user...")
            admin = AdminUser(
                email="admin@visualivr.com",
                hashed_password=hash_password("adminpassword123"),
                role=AdminRole.super_admin
            )
            db.add(admin)
            db.commit()
            print("Default admin created: admin@visualivr.com / adminpassword123")
        else:
            print("Admin user already exists.")

        # Delete existing nodes to do a fresh clean unified re-seed
        print("Clearing existing menu nodes...")
        db.query(MenuNode).delete()
        db.commit()

        print("Seeding single unified bilingual IVR menu tree...")
        
        # --- SINGLE UNIFIED ROOT NODE ---
        root = MenuNode(
            parent_id=None,
            labels={"en": "Main Menu", "am": "ዋና ምናሌ"},
            prompt_texts={
                "en": "Welcome to our visual phone menu. Please select one of the following options.",
                "am": "እንኳን ወደ ቪዥዋል ስልክ ምናሌ በደህና መጡ። እባክዎ ከሚከተሉት አማራጮች ውስጥ አንዱን ይምረጡ።"
            },
            audio_url=None,
            sort_order=1,
            action_type=ActionType.navigate,
            action_target=None
        )
        db.add(root)
        db.flush() # get root.id
        
        # --- 1st LEVEL SUB-NODES (Under Main Menu) ---
        
        # 1. Billing & Payments
        billing = MenuNode(
            parent_id=root.id,
            labels={"en": "Billing & Payments", "am": "ክፍያ እና ሂሳብ"},
            prompt_texts={
                "en": "For billing questions, payments, or account disputes. Please select an option.",
                "am": "ለክፍያ ጥያቄዎች፣ ክፍያዎች ወይም የሂሳብ ክርክሮች። እባክዎ አማራጭ ይምረጡ።"
            },
            audio_url=None,
            sort_order=1,
            action_type=ActionType.navigate,
            action_target=None
        )
        db.add(billing)
        db.flush()

        # 2. Technical Support
        tech_support = MenuNode(
            parent_id=root.id,
            labels={"en": "Technical Support", "am": "የቴክኒክ ድጋፍ"},
            prompt_texts={
                "en": "Our support team is here to help with your device, connection, or software issues.",
                "am": "የቴክኒክ ድጋፍ ቡድናችን በመሳሪያዎ፣ በግንኙነትዎ ወይም በሶፍትዌር ችግሮችዎ ላይ ለመርዳት እዚህ አለ።"
            },
            audio_url=None,
            sort_order=2,
            action_type=ActionType.navigate,
            action_target=None
        )
        db.add(tech_support)
        db.flush()

        # 3. Business Hours & Location (Direct Info)
        store_info = MenuNode(
            parent_id=root.id,
            labels={"en": "Business Hours & Location", "am": "የስራ ሰዓታት እና አድራሻ"},
            prompt_texts={
                "en": "We are open Monday to Friday, 9 AM to 6 PM. We are located at 123 Innovation Way, Tech City.",
                "am": "ከሰኞ እስከ አርብ ከጠዋቱ 3 ሰዓት እስከ ማታ 12 ሰዓት እንከፍታለን። አድራሻችን 123 ኢንኖቬሽን ዌይ፣ ቴክ ሲቲ ነው።"
            },
            audio_url=None,
            sort_order=3,
            action_type=ActionType.info,
            action_target="123 Innovation Way, Tech City | Mon-Fri 9am-6pm"
        )
        db.add(store_info)

        # --- 2nd LEVEL SUB-NODES (Under Billing & Payments) ---
        
        pay_bill = MenuNode(
            parent_id=billing.id,
            labels={"en": "Pay My Bill", "am": "ሂሳቤን ለመክፈል"},
            prompt_texts={
                "en": "To pay your bill online, visit pay.visualivr.com. Or wait to connect with an agent to pay over the phone.",
                "am": "ሂሳብዎን በኢንተርኔት ለመክፈል pay.visualivr.com ይጎብኙ። ወይም በስልክ ለመክፈል ከደንበኛ ወኪል ጋር እስኪገናኙ ድረስ ይጠብቁ።"
            },
            audio_url=None,
            sort_order=1,
            action_type=ActionType.info,
            action_target="pay.visualivr.com"
        )
        db.add(pay_bill)

        connect_billing = MenuNode(
            parent_id=billing.id,
            labels={"en": "Speak to Billing Agent", "am": "ከሂሳብ ባለሙያ ጋር ለመነጋገር"},
            prompt_texts={
                "en": "Transferring you to our billing department now.",
                "am": "አሁን ወደ ሂሳብ ክፍላችን በማስተላለፍ ላይ ነን።"
            },
            audio_url=None,
            sort_order=2,
            action_type=ActionType.connect_agent,
            action_target="1002"
        )
        db.add(connect_billing)

        callback_billing = MenuNode(
            parent_id=billing.id,
            labels={"en": "Request a Callback", "am": "መልሶ መደወል ለመጠየቅ"},
            prompt_texts={
                "en": "We can call you back at your number as soon as an agent is free. Do you want to request a callback?",
                "am": "ወኪል እንደተረፈ በስልክ ቁጥርዎ መልሰን ልንደውልልዎ እንችላለን። መልሶ መደወል ይጠይቃሉ?"
            },
            audio_url=None,
            sort_order=3,
            action_type=ActionType.callback,
            action_target="billing_callback_queue"
        )
        db.add(callback_billing)

        # --- 2nd LEVEL SUB-NODES (Under Technical Support) ---
        
        connect_support = MenuNode(
            parent_id=tech_support.id,
            labels={"en": "Connect to Support Agent", "am": "ከድጋፍ ሰጪ ወኪል ጋር ለመገናኘት"},
            prompt_texts={
                "en": "Connecting you to a technical support specialist.",
                "am": "ከቴክኒክ ድጋፍ ባለሙያ ጋር በማገናኘት ላይ ነን።"
            },
            audio_url=None,
            sort_order=1,
            action_type=ActionType.connect_agent,
            action_target="1002"
        )
        db.add(connect_support)

        callback_support = MenuNode(
            parent_id=tech_support.id,
            labels={"en": "Request Support Callback", "am": "የቴክኒክ መልሶ መደወል ለመጠየቅ"},
            prompt_texts={
                "en": "Leave a message and queue a callback for technical support.",
                "am": "መልእክት ያስቀምጡ እና ለቴክኒክ ድጋፍ መልሶ መደወል ይጠይቁ።"
            },
            audio_url=None,
            sort_order=2,
            action_type=ActionType.callback,
            action_target="support_callback_queue"
        )
        db.add(callback_support)

        db.commit()
        print("Unified bilingual IVR menu tree seeded successfully!")
            
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}", file=sys.stderr)
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
