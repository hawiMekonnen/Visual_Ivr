def test_get_menu_tree(client):
    response = client.get("/api/menu/tree")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == 1
    assert data[0]["labels"]["en"] == "Welcome"
    assert len(data[0]["children"]) == 1
    assert data[0]["children"][0]["id"] == 2
    assert data[0]["children"][0]["action_type"] == "connect_agent"

def test_get_menu_node(client):
    response = client.get("/api/menu/node/1")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == 1
    assert len(data["children"]) == 1

    response = client.get("/api/menu/node/999")
    assert response.status_code == 404

def test_session_lifecycle(client):
    # 1. Create Session
    resp = client.post("/api/sessions", json={"source": "web"})
    assert resp.status_code == 201
    session = resp.json()
    assert "id" in session
    session_id = session["id"]

    # 2. Select Node 1
    resp = client.post(f"/api/sessions/{session_id}/select", json={"node_id": 1})
    assert resp.status_code == 200
    sel_data = resp.json()
    assert sel_data["event"]["node_id"] == 1
    assert sel_data["node"]["id"] == 1

    # 3. Trigger action on node 2 (connect_agent)
    resp = client.post(
        f"/api/sessions/{session_id}/action",
        json={"node_id": 2, "locale": "en"}
    )
    assert resp.status_code == 200
    act_data = resp.json()
    assert act_data["action_type"] == "connect_agent"
    assert act_data["result"]["type"] == "tel"
    # 4. Telephony Webhook Trigger (FusionPBX / FreeSWITCH)
    resp = client.post(
        "/api/sessions/trigger-call-ivr",
        json={"caller_phone": "+251911223344", "destination_number": "8000"}
    )
    assert resp.status_code == 200
    trig_data = resp.json()
    assert trig_data["success"] is True
    assert trig_data["caller_phone"] == "+251911223344"
    assert "ivr_url" in trig_data
    assert "session_id" in trig_data

def test_admin_authentication_and_crud(client):
    # Try admin listing without token (should fail oauth2)
    resp = client.get("/api/admin/nodes")
    assert resp.status_code == 401

    # Login
    resp = client.post(
        "/api/admin/login",
        json={"email": "test_admin@visualivr.com", "password": "adminpassword123"}
    )
    assert resp.status_code == 200
    token_data = resp.json()
    token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # CRUD - Get nodes
    resp = client.get("/api/admin/nodes", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    # CRUD - Create Node
    new_node = {
        "labels": {"en": "Billing support"},
        "prompt_texts": {"en": "Speak to our team."},
        "parent_id": 1,
        "action_type": "navigate",
        "sort_order": 5
    }
    resp = client.post("/api/admin/nodes", json=new_node, headers=headers)
    assert resp.status_code == 201
    created = resp.json()
    assert created["labels"]["en"] == "Billing support"
    node_id = created["id"]

    # CRUD - Patch Node
    resp = client.patch(
        f"/api/admin/nodes/{node_id}",
        json={"labels": {"en": "Billing support updated", "es": "Soporte de Facturación"}},
        headers=headers
    )
    assert resp.status_code == 200
    updated = resp.json()
    assert updated["labels"]["en"] == "Billing support updated"
    assert updated["labels"]["es"] == "Soporte de Facturación"

    # CRUD - Delete Node
    resp = client.delete(f"/api/admin/nodes/{node_id}", headers=headers)
    assert resp.status_code == 204

    # Analytics Endpoint Check
    resp = client.get("/api/admin/analytics", headers=headers)
    assert resp.status_code == 200
    analytics = resp.json()
    assert "total_sessions" in analytics
    assert "avg_session_depth" in analytics
