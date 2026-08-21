# 📞 Visual IVR Web Application

A full-stack Visual IVR (Interactive Voice Response) web application. Instead of listening to slow, frustrating phone menus ("Press 1 for Support, Press 2 for Billing..."), customers can interact with the call flow visually using buttons, audio recordings, or Text-to-Speech narration directly in their browser.

---

## 🛠️ Technology Stack

- **Backend**: Python, FastAPI, SQLAlchemy ORM, Pydantic v2 validation.
- **Database**: PostgreSQL (production/docker-compose) or SQLite (local development).
- **Frontend**: React (Vite), Axios for API transactions, HSL Glassmorphic CSS design.
- **Audio**: Hybrid browser `speechSynthesis` (TTS) fallback + local audio file media storage manager.
- **Infrastructure**: Dockerized multi-container setup (Docker Compose).

---

## 🚀 Getting Started (Docker Compose)

The easiest way to run the entire stack (Postgres Database, FastAPI API, React Frontend) is using Docker Compose:

1. **Build and start the containers**:
   ```bash
   docker-compose up --build
   ```
2. **Access the application**:
   - **Frontend UI**: [http://localhost:3000](http://localhost:3000)
   - **Admin Dashboard**: [http://localhost:3000/admin](http://localhost:3000/admin)
   - **Interactive API Docs (Swagger)**: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)
   - **No-JS Fallback Menu**: [http://localhost:8000/menu-fallback](http://localhost:8000/menu-fallback)

---

## ⚙️ Running Locally (Without Docker)

### 1. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Seed the database with default nodes and admin credentials:
   ```bash
   python seed.py
   ```
5. Start the API server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### 2. Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the site at [http://localhost:5173](http://localhost:5173).

---

## 🧪 Running Backend Unit Tests

We use `pytest` for endpoint testing. Make sure your virtual environment is active in the `backend/` directory:

```bash
cd backend
pytest tests/ -v
```

---

## 🔒 Default Admin Credentials

When the database is seeded (`seed.py`), a default admin account is created:
- **Email**: `admin@visualivr.com`
- **Password**: `adminpassword123`

---

## 📞 Swapping the Telephony Connector

The "Speak to Agent" action utilizes a pluggable connector model located in `backend/app/agents/`:

1. **Implement your new provider**:
   Create a class implementing `AgentConnector` from `backend/app/agents/base.py`. For example, a Twilio connector:
   ```python
   # backend/app/agents/twilio.py
   from app.agents.base import AgentConnector
   
   class TwilioAgentConnector(AgentConnector):
       def connect(self, session_id: str, target: str | None) -> dict:
           # Execute telephony actions (e.g. initiating Twilio SIP trunk call)
           return {
               "type": "twilio",
               "href": f"sip:{target}@yourdomain.sip.twilio.com",
               "message": "Connecting call via Twilio..."
           }
   ```
2. **Register it**:
   Add your class to the registry in `backend/app/agents/registry.py`:
   ```python
   from app.agents.twilio import TwilioAgentConnector
   _REGISTRY = {
       "dev": DevAgentConnector,
       "twilio": TwilioAgentConnector
   }
   ```
3. **Toggle Environment Variable**:
   In your `.env` file, change `AGENT_CONNECTOR` to trigger your swap without touching frontend code:
   ```env
   AGENT_CONNECTOR=twilio
   ```
