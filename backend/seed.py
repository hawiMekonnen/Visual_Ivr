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

        # Delete existing nodes to do a fresh re-seed
        print("Clearing existing menu nodes...")
        db.query(MenuNode).delete()
        db.commit()

        # Check if we already have menu nodes
        node_count = db.query(MenuNode).count()
        if node_count == 0:
            print("Seeding sample IVR menu tree...")
            
            # --- ROOT NODES ---
            
            # Root 1: Main Menu (English)
            root_en = MenuNode(
                parent_id=None,
                labels={"en": "English Menu", "am": "የእንግሊዘኛ ምናሌ", "es": "Menú en Inglés"},
                prompt_texts={
                    "en": "Welcome to our visual phone menu. Please select one of the following options.",
                    "am": "እንኳን ወደ ቪዥዋል ስልክ ምናሌ በደህና መጡ። እባክዎ ከሚከተሉት አማራጮች ውስጥ አንዱን ይምረጡ።",
                    "es": "Bienvenido a nuestro menú telefónico visual. Por favor seleccione una de las siguientes opciones."
                },
                audio_url=None,
                sort_order=1,
                action_type=ActionType.navigate,
                action_target=None
            )
            db.add(root_en)
            db.flush() # get root_en.id
            
            # Root 2: Main Menu (Amharic)
            root_am = MenuNode(
                parent_id=None,
                labels={"en": "Amharic Menu", "am": "የአማርኛ ምናሌ", "es": "Menú en Amárico"},
                prompt_texts={
                    "en": "Welcome to our Amharic service. Please select an option.",
                    "am": "እንኳን ወደ አማርኛ አገልግሎታችን በደህና መጡ። እባክዎ አማራጭ ይምረጡ።",
                    "es": "Bienvenido a nuestro servicio en amárico. Por favor seleccione una opción."
                },
                audio_url=None,
                sort_order=2,
                action_type=ActionType.navigate,
                action_target=None
            )
            db.add(root_am)
            db.flush()

            # --- SUB-NODES FOR ENGLISH MENU ---

            
            # Node 1.1: Billing & Accounts
            billing = MenuNode(
                parent_id=root_en.id,
                labels={"en": "Billing & Payments", "am": "ክፍያ እና ሂሳብ", "es": "Facturación y Pagos"},
                prompt_texts={
                    "en": "For billing questions, payments, or account disputes. Please select an option.",
                    "am": "ለክፍያ ጥያቄዎች፣ ክፍያዎች ወይም የሂሳብ ክርክሮች። እባክዎ አማራጭ ይምረጡ።",
                    "es": "Para preguntas de facturación, pagos o disputas de cuentas. Por favor seleccione una opción."
                },
                audio_url=None,
                sort_order=1,
                action_type=ActionType.navigate,
                action_target=None
            )
            db.add(billing)
            db.flush()

            # Node 1.2: Technical Support
            tech_support = MenuNode(
                parent_id=root_en.id,
                labels={"en": "Technical Support", "am": "የቴክኒክ ድጋፍ", "es": "Soporte Técnico"},
                prompt_texts={
                    "en": "Our support team is here to help with your device, connection, or software issues.",
                    "am": "የቴክኒክ ድጋፍ ቡድናችን በመሳሪያዎ፣ በግንኙነትዎ ወይም በሶፍትዌር ችግሮችዎ ላይ ለመርዳት እዚህ አለ።",
                    "es": "Nuestro equipo de soporte está aquí para ayudar con su dispositivo, conexión o problemas de software."
                },
                audio_url=None,
                sort_order=2,
                action_type=ActionType.navigate,
                action_target=None
            )
            db.add(tech_support)
            db.flush()

            # Node 1.3: Store Info
            store_info = MenuNode(
                parent_id=root_en.id,
                labels={"en": "Business Hours & Location", "am": "የስራ ሰዓታት እና አድራሻ", "es": "Horarios y Ubicación"},
                prompt_texts={
                    "en": "We are open Monday to Friday, 9 AM to 6 PM. We are located at 123 Innovation Way, Tech City.",
                    "am": "ከሰኞ እስከ አርብ ከጠዋቱ 3 ሰዓት እስከ ማታ 12 ሰዓት እንከፍታለን። አድራሻችን 123 ኢንኖቬሽን ዌይ፣ ቴክ ሲቲ ነው።",
                    "es": "Estamos abiertos de lunes a viernes, de 9 AM a 6 PM. Estamos ubicados en 123 Innovation Way, Tech City."
                },
                audio_url=None,
                sort_order=3,
                action_type=ActionType.info,
                action_target="123 Innovation Way, Tech City | Mon-Fri 9am-6pm"
            )
            db.add(store_info)

            # --- BILLING OPTIONS ---
            
            # Billing Child 1: Pay Bill (Info/Navigate)
            pay_bill = MenuNode(
                parent_id=billing.id,
                labels={"en": "Pay My Bill", "am": "ሂሳቤን ለመክፈል", "es": "Pagar Mi Factura"},
                prompt_texts={
                    "en": "To pay your bill online, visit pay.visualivr.com. Or wait to connect with an agent to pay over the phone.",
                    "am": "ሂሳብዎን በኢንተርኔት ለመክፈል pay.visualivr.com ይጎብኙ። ወይም በስልክ ለመክፈል ከደንበኛ ወኪል ጋር እስኪገናኙ ድረስ ይጠብቁ።",
                    "es": "Para pagar su factura en línea, visite pay.visualivr.com. O espere para conectarse con un agente para pagar por teléfono."
                },
                audio_url=None,
                sort_order=1,
                action_type=ActionType.info,
                action_target="pay.visualivr.com"
            )
            db.add(pay_bill)

            # Billing Child 2: Connect Billing Agent (Action)
            connect_billing = MenuNode(
                parent_id=billing.id,
                labels={"en": "Speak to Billing Agent", "am": "ከሂሳብ ባለሙያ ጋር ለመነጋገር", "es": "Hablar con Agente de Facturación"},
                prompt_texts={
                    "en": "Transferring you to our billing department now.",
                    "am": "አሁን ወደ ሂሳብ ክፍላችን በማስተላለፍ ላይ ነን።",
                    "es": "Transfiriendo al departamento de facturación ahora."
                },
                audio_url=None,
                sort_order=2,
                action_type=ActionType.connect_agent,
                action_target="8001" # Extension 8001
            )
            db.add(connect_billing)

            # Billing Child 3: Request Callback (Action)
            callback_billing = MenuNode(
                parent_id=billing.id,
                labels={"en": "Request a Callback", "am": "መልሶ መደወል ለመጠየቅ", "es": "Solicitar una Llamada de Vuelta"},
                prompt_texts={
                    "en": "We can call you back at your number as soon as an agent is free. Do you want to request a callback?",
                    "am": "ወኪል እንደተረፈ በስልክ ቁጥርዎ መልሰን ልንደውልልዎ እንችላለን። መልሶ መደወል ይጠይቃሉ?",
                    "es": "Podemos devolverle la llamada a su número tan pronto como un agente esté libre. ¿Desea solicitar una llamada?"
                },
                audio_url=None,
                sort_order=3,
                action_type=ActionType.callback,
                action_target="billing_callback_queue"
            )
            db.add(callback_billing)

            # --- TECH SUPPORT OPTIONS ---
            
            # Support Child 1: Speak to Support Agent (Action)
            connect_support = MenuNode(
                parent_id=tech_support.id,
                labels={"en": "Connect to Support Agent", "am": "ከድጋፍ ሰጪ ወኪል ጋር ለመገናኘት", "es": "Conectar con Agente de Soporte"},
                prompt_texts={
                    "en": "Connecting you to a technical support specialist.",
                    "am": "ከቴክኒክ ድጋፍ ባለሙያ ጋር በማገናኘት ላይ ነን።",
                    "es": "Conectándolo con un especialista en soporte técnico."
                },
                audio_url=None,
                sort_order=1,
                action_type=ActionType.connect_agent,
                action_target="8002"
            )
            db.add(connect_support)

            # Support Child 2: Request Support Callback (Action)
            callback_support = MenuNode(
                parent_id=tech_support.id,
                labels={"en": "Request Callback", "am": "መልሶ መደወል ለመጠየቅ", "es": "Solicitar Llamada"},
                prompt_texts={
                    "en": "Leave a message and queue a callback for technical support.",
                    "am": "መልእክት ያስቀምጡ እና ለቴክኒክ ድጋፍ መልሶ መደወል ይጠይቁ።",
                    "es": "Deje un mensaje y solicite una llamada de vuelta para soporte técnico."
                },
                audio_url=None,
                sort_order=2,
                action_type=ActionType.callback,
                action_target="support_callback_queue"
            )
            db.add(callback_support)


            # --- AMHARIC MENU OPTIONS ---
            
            am_billing = MenuNode(
                parent_id=root_am.id,
                labels={"en": "Billing Services (Amharic)", "am": "የክፍያ እና ሂሳብ አገልግሎቶች", "es": "Servicios de Facturación (Amárico)"},
                prompt_texts={
                    "en": "For billing services in Amharic.",
                    "am": "ለክፍያ እና ሂሳብ አገልግሎቶች በአማርኛ። እባክዎ አማራጭ ይምረጡ።",
                    "es": "Para servicios de facturación en amárico. Por favor seleccione una opción."
                },
                audio_url=None,
                sort_order=1,
                action_type=ActionType.navigate,
                action_target=None
            )
            db.add(am_billing)
            db.flush()

            am_connect_billing = MenuNode(
                parent_id=am_billing.id,
                labels={"en": "Amharic Billing Agent", "am": "ከአማርኛ ሂሳብ ባለሙያ ጋር ለመነጋገር", "es": "Agente de Facturación en Amárico"},
                prompt_texts={
                    "en": "Transferring to an Amharic-speaking billing agent.",
                    "am": "ወደ አማርኛ ተናጋሪ የሂሳብ ባለሙያ በማስተላለፍ ላይ ነን።",
                    "es": "Transfiriendo a un agente de facturación de habla amárico."
                },
                audio_url=None,
                sort_order=1,
                action_type=ActionType.connect_agent,
                action_target="8009"
            )
            db.add(am_connect_billing)

            db.commit()
            print("Sample IVR menu tree seeded successfully with English and Amharic!")
        else:
            print(f"Database already contains {node_count} nodes. Skipping seed.")
            
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}", file=sys.stderr)
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
