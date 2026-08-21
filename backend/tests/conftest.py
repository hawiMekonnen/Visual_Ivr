import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.config import get_settings
from app.models import AdminUser, MenuNode, ActionType, AdminRole
from app.auth import hash_password

# Setup SQLite in-memory database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    # Create the tables
    Base.metadata.create_all(bind=engine)
    db_session = TestingSessionLocal()
    
    # Seed default test admin and menu
    admin = AdminUser(
        email="test_admin@visualivr.com",
        hashed_password=hash_password("adminpassword123"),
        role=AdminRole.super_admin
    )
    db_session.add(admin)
    
    # Add a root node
    root = MenuNode(
        id=1,
        parent_id=None,
        labels={"en": "Welcome", "es": "Bienvenido"},
        prompt_texts={"en": "Please choose an option.", "es": "Por favor elija una opción."},
        sort_order=1,
        action_type=ActionType.navigate,
        action_target=None
    )
    db_session.add(root)
    db_session.flush()
    
    # Add a child node
    child = MenuNode(
        id=2,
        parent_id=1,
        labels={"en": "Talk to Agent", "es": "Hablar con Agente"},
        prompt_texts={"en": "Connecting you to an agent.", "es": "Conectando con un agente."},
        sort_order=1,
        action_type=ActionType.connect_agent,
        action_target="8000"
    )
    db_session.add(child)
    db_session.commit()
    
    yield db_session
    
    # Clean up
    db_session.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
