import React, { useState, useEffect } from "react";
import client from "../../api/client";

const AdminApp = () => {
  const [token, setToken] = useState(localStorage.getItem("admin_token") || null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [nodes, setNodes] = useState([]);
  const [flatNodes, setFlatNodes] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState("editor"); // "editor" | "analytics"

  // Node editing state
  const [editingNode, setEditingNode] = useState(null); // null means "creating a new node"
  const [formData, setFormData] = useState({
    parent_id: "",
    label_en: "",
    label_es: "",
    prompt_en: "",
    prompt_es: "",
    action_type: "navigate",
    action_target: "",
    sort_order: 0,
  });
  const [audioFile, setAudioFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");

  // Check login
  useEffect(() => {
    if (token) {
      localStorage.setItem("admin_token", token);
      fetchNodes();
      fetchAnalytics();
    } else {
      localStorage.removeItem("admin_token");
    }
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await client.post("/api/admin/login", { email, password });
      setToken(res.data.access_token);
    } catch (err) {
      console.error(err);
      setLoginError("Invalid email or password.");
    }
  };

  const handleLogout = () => {
    setToken(null);
  };

  const fetchNodes = async () => {
    try {
      const res = await client.get("/api/admin/nodes");
      setNodes(res.data);
      // Flatten nodes list for parent dropdown selectors
      const flat = [];
      const traverse = (node) => {
        flat.push(node);
        node.children.forEach(traverse);
      };
      res.data.forEach(traverse);
      setFlatNodes(flat);
    } catch (err) {
      console.error("Error fetching nodes:", err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await client.get("/api/admin/analytics");
      setAnalytics(res.data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    }
  };

  const handleSaveNode = async (e) => {
    e.preventDefault();
    const payload = {
      labels: { en: formData.label_en, es: formData.label_es },
      prompt_texts: { en: formData.prompt_en, es: formData.prompt_es },
      parent_id: formData.parent_id ? parseInt(formData.parent_id, 10) : null,
      action_type: formData.action_type,
      action_target: formData.action_target || null,
      sort_order: parseInt(formData.sort_order, 10) || 0,
    };

    try {
      if (editingNode) {
        await client.patch(`/api/admin/nodes/${editingNode.id}`, payload);
      } else {
        await client.post("/api/admin/nodes", payload);
      }
      fetchNodes();
      resetForm();
    } catch (err) {
      console.error("Error saving node:", err);
      alert("Failed to save node. Make sure English fields are populated.");
    }
  };

  const handleEditClick = (node) => {
    setEditingNode(node);
    setFormData({
      parent_id: node.parent_id || "",
      label_en: node.labels.en || "",
      label_es: node.labels.es || "",
      prompt_en: node.prompt_texts.en || "",
      prompt_es: node.prompt_texts.es || "",
      action_type: node.action_type,
      action_target: node.action_target || "",
      sort_order: node.sort_order || 0,
    });
  };

  const handleDeleteClick = async (nodeId) => {
    if (!window.confirm("Are you sure you want to delete this node and all of its children?")) return;
    try {
      await client.delete(`/api/admin/nodes/${nodeId}`);
      fetchNodes();
      resetForm();
    } catch (err) {
      console.error("Error deleting node:", err);
    }
  };

  const handleMoveOrder = async (node, direction) => {
    // Find siblings
    const siblings = node.parent_id
      ? flatNodes.find((n) => n.id === node.parent_id)?.children || []
      : nodes;

    const idx = siblings.findIndex((n) => n.id === node.id);
    if (direction === "up" && idx > 0) {
      const target = siblings[idx - 1];
      await swapSortOrders(node, target);
    } else if (direction === "down" && idx < siblings.length - 1) {
      const target = siblings[idx + 1];
      await swapSortOrders(node, target);
    }
  };

  const swapSortOrders = async (nodeA, nodeB) => {
    const orderA = nodeA.sort_order;
    const orderB = nodeB.sort_order;
    // If order numbers are identical, shift one
    const newOrderA = orderB === orderA ? orderA + 1 : orderB;
    const newOrderB = orderA;

    try {
      await client.post("/api/admin/nodes/reorder", {
        nodes: [
          { id: nodeA.id, sort_order: newOrderA },
          { id: nodeB.id, sort_order: newOrderB },
        ],
      });
      fetchNodes();
    } catch (err) {
      console.error("Error reordering:", err);
    }
  };

  const resetForm = () => {
    setEditingNode(null);
    setFormData({
      parent_id: "",
      label_en: "",
      label_es: "",
      prompt_en: "",
      prompt_es: "",
      action_type: "navigate",
      action_target: "",
      sort_order: 0,
    });
    setAudioFile(null);
    setUploadStatus("");
  };

  const handleAudioUpload = async (e) => {
    e.preventDefault();
    if (!editingNode || !audioFile) return;
    setUploadStatus("Uploading...");

    const fileForm = new FormData();
    fileForm.append("file", audioFile);

    try {
      const res = await client.post(`/api/admin/audio?node_id=${editingNode.id}`, fileForm, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadStatus("✓ Success!");
      fetchNodes();
      // Update local edit record URL reference
      setEditingNode((prev) => ({ ...prev, audio_url: res.data.audio_url }));
    } catch (err) {
      console.error("Audio upload error:", err);
      setUploadStatus("Failed to upload file.");
    }
  };

  if (!token) {
    return (
      <div className="app-card" style={{ maxWidth: "400px", margin: "80px auto", minHeight: "auto" }}>
        <h1>Admin Control Panel</h1>
        <h2 style={{ fontSize: "0.85rem", marginBottom: "24px" }}>Authenticate to manage phone tree menu</h2>
        {loginError && <div style={{ color: "#ef4444", marginBottom: "12px", fontSize: "0.9rem" }}>{loginError}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="login-email">Email Address</label>
            <input
              type="email"
              id="login-email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              type="password"
              id="login-password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "12px" }}>
            Login Securely
          </button>
        </form>
      </div>
    );
  }

  // Render tree node recursive list item in editor dashboard
  const renderTreeEditor = (node, depth = 0) => {
    return (
      <div key={node.id} style={{ marginLeft: `${depth * 16}px` }}>
        <div className="tree-node-item" style={{ borderColor: editingNode?.id === node.id ? "#818cf8" : "rgba(255,255,255,0.05)" }}>
          <div>
            <span style={{ fontWeight: "600", color: "#f1f5f9" }}>{node.labels.en}</span>
            <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: "10px" }}>
              ({node.action_type}{node.action_target ? `: ${node.action_target}` : ""})
            </span>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button className="control-btn" onClick={() => handleMoveOrder(node, "up")} style={{ padding: "4px 8px" }}>▲</button>
            <button className="control-btn" onClick={() => handleMoveOrder(node, "down")} style={{ padding: "4px 8px" }}>▼</button>
            <button className="control-btn" onClick={() => handleEditClick(node)} style={{ padding: "4px 8px", background: "rgba(99,102,241,0.15)", color: "#a5b4fc" }}>Edit</button>
            <button className="control-btn" onClick={() => handleDeleteClick(node.id)} style={{ padding: "4px 8px", background: "rgba(239,68,68,0.15)", color: "#fca5a5" }}>Delete</button>
          </div>
        </div>
        {node.children && node.children.map((child) => renderTreeEditor(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="admin-container">
      {/* Header bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "16px" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem" }}>⚙️ IVR Administration Suite</h1>
          <p style={{ color: "#64748b", margin: 0 }}>Configure nodes, record sound menus, and check tracking events</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className={`btn ${activeTab === "editor" ? "btn-primary" : "control-btn"}`} onClick={() => setActiveTab("editor")}>
            Tree Config Editor
          </button>
          <button className={`btn ${activeTab === "analytics" ? "btn-primary" : "control-btn"}`} onClick={() => setActiveTab("analytics")}>
            Live Analytics
          </button>
          <button className="control-btn" onClick={() => window.location.href = "/"}>
            Exit Panel
          </button>
          <button className="control-btn" onClick={handleLogout} style={{ border: "1px solid #ef4444", color: "#fca5a5" }}>
            Logout
          </button>
        </div>
      </div>

      {activeTab === "editor" ? (
        <div className="admin-grid">
          {/* Tree viewer list */}
          <div>
            <h2 style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>Menu Tree Hierarchy</h2>
            <div style={{ maxHeight: "600px", overflowY: "auto", paddingRight: "8px" }}>
              {nodes.map((node) => renderTreeEditor(node, 0))}
              {nodes.length === 0 && <p style={{ color: "#64748b" }}>No nodes created yet.</p>}
            </div>
          </div>

          {/* Form Editor panel */}
          <div>
            <h2 style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
              {editingNode ? `Editing Node: ${editingNode.labels.en}` : "Create New Node"}
            </h2>
            
            <form onSubmit={handleSaveNode}>
              <div className="form-group">
                <label>Parent Node</label>
                <select
                  className="form-control"
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                >
                  <option value="">[None - Root Node Level]</option>
                  {flatNodes
                    .filter((n) => !editingNode || n.id !== editingNode.id)
                    .map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.labels.en} (ID: {n.id})
                      </option>
                    ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label>Label (English) *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.label_en}
                    onChange={(e) => setFormData({ ...formData, label_en: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Label (Español)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.label_es}
                    onChange={(e) => setFormData({ ...formData, label_es: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Prompt TTS Text (English) *</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={formData.prompt_en}
                  onChange={(e) => setFormData({ ...formData, prompt_en: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Prompt TTS Text (Español)</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={formData.prompt_es}
                  onChange={(e) => setFormData({ ...formData, prompt_es: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label>Action Type</label>
                  <select
                    className="form-control"
                    value={formData.action_type}
                    onChange={(e) => setFormData({ ...formData, action_type: e.target.value })}
                  >
                    <option value="navigate">Navigate sub-options</option>
                    <option value="connect_agent">Connect to agent (Extension link)</option>
                    <option value="callback">Collect callback number</option>
                    <option value="info">Info note display</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Action Target (Extension/Department/URL)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 8001 or support_queue"
                    value={formData.action_target}
                    onChange={(e) => setFormData({ ...formData, action_target: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ maxWidth: "120px" }}>
                <label>Sort Order</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
                <button type="submit" className="btn btn-primary">
                  {editingNode ? "Save Update" : "Create Node"}
                </button>
                <button type="button" className="btn control-btn" onClick={resetForm}>
                  Cancel / New Node
                </button>
              </div>
            </form>

            {editingNode && (
              <div style={{ marginTop: "32px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "20px" }}>
                <h3>Voice Audio Recording</h3>
                <p style={{ color: "#64748b", fontSize: "0.85rem" }}>
                  Upload an audio file (MP3/WAV) to replace Browser Speech Synthesis.
                </p>
                {editingNode.audio_url && (
                  <div style={{ marginBottom: "16px", background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "8px" }}>
                    <span style={{ fontSize: "0.85rem", color: "#22c55e", display: "block" }}>✓ Audio configured</span>
                    <audio src={`${import.meta.env.VITE_API_URL || "http://localhost:8000"}${editingNode.audio_url}`} controls style={{ marginTop: "8px", height: "36px" }} />
                  </div>
                )}
                <form onSubmit={handleAudioUpload} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setAudioFile(e.target.files[0])}
                    required
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: "8px 16px" }}>
                    Upload File
                  </button>
                </form>
                {uploadStatus && <div style={{ fontSize: "0.85rem", color: "#a5b4fc", marginTop: "6px" }}>{uploadStatus}</div>}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ marginTop: "24px" }}>
          <h2>Live IVR Flow Performance Analytics</h2>
          
          {analytics ? (
            <div>
              {/* Summary stat cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "32px" }}>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "20px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ display: "block", color: "#64748b", fontSize: "0.85rem", fontWeight: "600" }}>Total Session Instances</span>
                  <span style={{ fontSize: "2rem", color: "#fff", fontWeight: "700" }}>{analytics.total_sessions}</span>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "20px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ display: "block", color: "#64748b", fontSize: "0.85rem", fontWeight: "600" }}>Total Node Selections</span>
                  <span style={{ fontSize: "2rem", color: "#818cf8", fontWeight: "700" }}>{analytics.total_selections}</span>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "20px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ display: "block", color: "#64748b", fontSize: "0.85rem", fontWeight: "600" }}>Average Session Path Depth</span>
                  <span style={{ fontSize: "2rem", color: "#a855f7", fontWeight: "700" }}>{analytics.avg_session_depth} nodes</span>
                </div>
              </div>

              {/* Graphic Chart representation */}
              <h3>Node Hit Counts & Dropoff Rate</h3>
              <div style={{ background: "rgba(255,255,255,0.02)", padding: "24px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)", marginBottom: "24px" }}>
                {analytics.nodes.length === 0 ? (
                  <p style={{ color: "#64748b" }}>No events registered yet.</p>
                ) : (
                  <div>
                    {/* SVG BAR CHART */}
                    <div style={{ position: "relative", width: "100%", height: "240px", display: "flex", alignItems: "flex-end", gap: "24px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "10px" }}>
                      {analytics.nodes.slice(0, 8).map((node, i) => {
                        const maxHit = Math.max(...analytics.nodes.map((n) => n.selection_count), 1);
                        const percent = (node.selection_count / maxHit) * 100;
                        return (
                          <div key={node.node_id} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                            <span style={{ fontSize: "0.8rem", color: "#818cf8", marginBottom: "6px" }}>{node.selection_count}</span>
                            <div style={{ width: "100%", height: `${percent * 0.8}%`, background: "linear-gradient(to top, #6366f1, #c084fc)", borderRadius: "4px 4px 0 0", minHeight: "4px" }} />
                            <span style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "8px", textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden", maxWidth: "80px" }}>
                              {node.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Table View */}
                    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "32px", fontSize: "0.9rem" }}>
                      <thead>
                        <tr style={{ textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#64748b" }}>
                          <th style={{ padding: "12px" }}>Node Label</th>
                          <th style={{ padding: "12px" }}>Clicks (Hits)</th>
                          <th style={{ padding: "12px" }}>Drop-offs</th>
                          <th style={{ padding: "12px" }}>Drop-off Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.nodes.map((node) => (
                          <tr key={node.node_id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                            <td style={{ padding: "12px", color: "#f1f5f9" }}>{node.label}</td>
                            <td style={{ padding: "12px", color: "#a5b4fc" }}>{node.selection_count}</td>
                            <td style={{ padding: "12px", color: "#fca5a5" }}>{node.drop_off_count}</td>
                            <td style={{ padding: "12px", fontWeight: "600" }}>{(node.drop_off_rate * 100).toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p style={{ color: "#64748b" }}>Fetching live analytics stats...</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminApp;
