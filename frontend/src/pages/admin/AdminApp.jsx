import React, { useState, useEffect } from "react";
import client from "../../api/client";
import FlowCanvas from "./FlowCanvas";
import AgentCopilotHub from "./AgentCopilotHub";

// ─── SVG Icon helper ──────────────────────────────────────────────────────────
const Ico = ({ name, size = 16 }) => {
  const paths = {
    Phone:    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.07 12 19.79 19.79 0 0 1 1 3.18 2 2 0 0 1 3 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>,
    Menu:     <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>,
    Chart:    <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    Settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    Edit:     <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    Trash:    <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>,
    Plus:     <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    ChevUp:   <polyline points="18 15 12 9 6 15"/>,
    ChevDn:   <polyline points="6 9 12 15 18 9"/>,
    Lock:     <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
    Mail:     <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
    User:     <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    Logout:   <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    External: <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></>,
    Check:    <polyline points="20 6 9 17 4 12"/>,
    Alert:    <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
    Grid:     <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>,
    Music:    <><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></>,
    Sparkles: <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"/>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
};

// ─── Action badge helpers ──────────────────────────────────────────────────────
const ACTION_BADGE_CLASS = {
  navigate:      "adm-badge adm-badge-navigate",
  connect_agent: "adm-badge adm-badge-call",
  callback:      "adm-badge adm-badge-callback",
  info:          "adm-badge adm-badge-info",
};
const ACTION_BADGE_LABEL = {
  navigate: "Navigate", connect_agent: "Call", callback: "Callback", info: "Info",
};

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ msg, type }) => (
  <div className={`adm-toast ${type}`}>
    <Ico name={type === "success" ? "Check" : "Alert"} size={14} /> {msg}
  </div>
);

// ─── Delete confirm modal ──────────────────────────────────────────────────────
const DeleteModal = ({ node, onConfirm, onCancel }) => (
  <div className="adm-modal-overlay" onClick={onCancel}>
    <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
      <div className="adm-modal-icon">🗑️</div>
      <div className="adm-modal-title">Delete "{node.labels.en}"?</div>
      <div className="adm-modal-body">
        This will permanently delete this node and all of its children. This cannot be undone.
      </div>
      <div className="adm-modal-actions">
        <button className="adm-btn adm-btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="adm-btn adm-btn-danger" onClick={onConfirm}>Delete Node</button>
      </div>
    </div>
  </div>
);

// ─── Tree node (recursive) ─────────────────────────────────────────────────────
const TreeNode = ({ node, depth, selectedId, onSelect, onDelete, onAddChild, onMove, siblings }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;
  const idx = siblings.findIndex((n) => n.id === node.id);

  return (
    <div className="adm-tree-node-wrap">
      <div
        className={`adm-tree-node${isSelected ? " selected" : ""}`}
        style={{ paddingLeft: `${4 + depth * 20}px` }}
        onClick={() => onSelect(node)}
      >
        <button
          className="adm-tree-expand-btn"
          style={{ visibility: hasChildren ? "visible" : "hidden" }}
          onClick={(e) => { e.stopPropagation(); setExpanded((x) => !x); }}
          title={expanded ? "Collapse" : "Expand"}
        >{expanded ? "−" : "+"}</button>

        <div className="adm-tree-node-info">
          <div className="adm-tree-node-label">{node.labels.en || "(untitled)"}</div>
          <div className="adm-tree-node-meta">
            {node.prompt_texts.en
              ? node.prompt_texts.en.slice(0, 52) + (node.prompt_texts.en.length > 52 ? "…" : "")
              : "No prompt text"}
          </div>
        </div>

        <span className={ACTION_BADGE_CLASS[node.action_type] || "adm-badge"}>
          {ACTION_BADGE_LABEL[node.action_type] || node.action_type}
        </span>

        <div className="adm-tree-node-actions" onClick={(e) => e.stopPropagation()}>
          <button className="adm-btn adm-btn-ghost adm-btn-icon adm-btn-sm" title="Move up"
            onClick={() => onMove(node, "up")} disabled={idx === 0}
            style={{ opacity: idx === 0 ? 0.3 : 1 }}>
            <Ico name="ChevUp" size={12} />
          </button>
          <button className="adm-btn adm-btn-ghost adm-btn-icon adm-btn-sm" title="Move down"
            onClick={() => onMove(node, "down")} disabled={idx === siblings.length - 1}
            style={{ opacity: idx === siblings.length - 1 ? 0.3 : 1 }}>
            <Ico name="ChevDn" size={12} />
          </button>
          <button className="adm-btn adm-btn-ghost adm-btn-icon adm-btn-sm" title="Add child"
            onClick={() => onAddChild(node)}>
            <Ico name="Plus" size={12} />
          </button>
          <button className="adm-btn adm-btn-danger adm-btn-icon adm-btn-sm" title="Delete"
            onClick={() => onDelete(node)}>
            <Ico name="Trash" size={12} />
          </button>
        </div>
      </div>

      {hasChildren && expanded && node.children.map((child) => (
        <TreeNode key={child.id} node={child} depth={depth + 1}
          selectedId={selectedId} onSelect={onSelect} onDelete={onDelete}
          onAddChild={onAddChild} onMove={onMove} siblings={node.children} />
      ))}
    </div>
  );
};

// ─── Node Editor ──────────────────────────────────────────────────────────────
const NodeEditor = ({ editingNode, presetParentId, flatNodes, onSave, onCancel, API_URL }) => {
  const isNew = !editingNode;
  const blank = { parent_id: "", label_en: "", label_am: "",
    prompt_en: "", prompt_am: "",
    action_type: "navigate", action_target: "", sort_order: 0 };

  const [form, setForm] = useState(blank);
  const [audioFile, setAudioFile] = useState(null);
  const [audioStatus, setAudioStatus] = useState(""); // "" | "uploading" | "success" | "error"
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingNode) {
      setForm({
        parent_id: editingNode.parent_id ?? "",
        label_en: editingNode.labels.en || "",
        label_am: editingNode.labels.am || "",
        prompt_en: editingNode.prompt_texts.en || "",
        prompt_am: editingNode.prompt_texts.am || "",
        action_type: editingNode.action_type || "navigate",
        action_target: editingNode.action_target || "",
        sort_order: editingNode.sort_order ?? 0,
      });
    } else {
      setForm({ ...blank, parent_id: presetParentId ?? "" });
    }
    setAudioFile(null);
    setAudioStatus("");
  }, [editingNode, presetParentId]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const labels = { en: form.label_en };
    if (form.label_am) labels.am = form.label_am;
    const prompt_texts = { en: form.prompt_en };
    if (form.prompt_am) prompt_texts.am = form.prompt_am;
    const payload = {
      labels, prompt_texts,
      parent_id: form.parent_id !== "" ? parseInt(form.parent_id, 10) : null,
      action_type: form.action_type,
      action_target: form.action_target || null,
      sort_order: parseInt(form.sort_order, 10) || 0,
    };
    try { await onSave(editingNode, payload); }
    finally { setSaving(false); }
  };

  const [translating, setTranslating] = useState(false);

  const handleAutoTranslate = async () => {
    if (!form.label_en && !form.prompt_en) return;
    setTranslating(true);
    try {
      const res = await client.post("/api/translate/node-fields", {
        label_en: form.label_en,
        prompt_en: form.prompt_en,
        target_lang: "am",
      });
      if (res.data) {
        setForm((prev) => ({
          ...prev,
          label_am: res.data.label || prev.label_am,
          prompt_am: res.data.prompt_text || prev.prompt_am,
        }));
      }
    } catch (err) {
      console.error("Gemini auto-translation failed:", err);
    } finally {
      setTranslating(false);
    }
  };

  const handleAudioUpload = async (e) => {
    e.preventDefault();
    if (!editingNode || !audioFile) return;
    setAudioStatus("uploading");
    const fd = new FormData();
    fd.append("file", audioFile);
    try {
      await client.post(`/api/admin/audio?node_id=${editingNode.id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAudioStatus("success");
      setAudioFile(null);
    } catch { setAudioStatus("error"); }
  };

  return (
    <div className="adm-card">
      <div className="adm-card-header">
        <div className="adm-card-title">
          <span className="adm-card-title-icon blue"><Ico name={isNew ? "Plus" : "Edit"} size={14} /></span>
          {isNew ? "Create New Node" : `Editing: ${editingNode.labels.en}`}
        </div>
        {!isNew && (
          <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={onCancel}>
            <Ico name="Plus" size={12} /> New node
          </button>
        )}
      </div>

      <div className="adm-card-body">
        <form onSubmit={handleSubmit}>
          <div className="adm-form-section">

            {/* Parent */}
            <div className="adm-field">
              <label className="adm-label">Parent Node</label>
              <select className="adm-select" value={form.parent_id} onChange={(e) => set("parent_id", e.target.value)}>
                <option value="">[Root — Top Level]</option>
                {flatNodes.filter((n) => !editingNode || n.id !== editingNode.id).map((n) => (
                  <option key={n.id} value={n.id}>{n.labels.en} (ID {n.id})</option>
                ))}
              </select>
            </div>

            {/* AI Translation Action */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: -4 }}>
              <button
                type="button"
                className="adm-btn adm-btn-secondary"
                onClick={handleAutoTranslate}
                disabled={translating || (!form.label_en && !form.prompt_en)}
                style={{
                  fontSize: "0.78rem",
                  padding: "5px 12px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  borderColor: "rgba(59, 130, 246, 0.4)",
                  background: "linear-gradient(135deg, rgba(239, 246, 255, 0.9), rgba(243, 232, 255, 0.9))",
                  color: "#1e40af",
                  fontWeight: 500,
                }}
                title="Auto-translate English label and prompt into Amharic"
              >
                <Ico name="Sparkles" size={13} />
                {translating ? "Translating…" : "Auto-Translate"}
              </button>
            </div>

            {/* Labels */}
            <div className="adm-form-row">
              <div className="adm-field">
                <label className="adm-label">Label (English) <span className="adm-label-required">*</span></label>
                <input className="adm-input" value={form.label_en} required
                  placeholder="e.g. Billing Support"
                  onChange={(e) => set("label_en", e.target.value)} />
              </div>
              <div className="adm-field">
                <label className="adm-label">Label (Amharic / አማርኛ)</label>
                <input className="adm-input" value={form.label_am} placeholder="e.g. ክፍያ ድጋፍ"
                  onChange={(e) => set("label_am", e.target.value)} />
              </div>
            </div>

            {/* Prompts */}
            <div className="adm-form-row">
              <div className="adm-field">
                <label className="adm-label">Prompt / TTS Text (English) <span className="adm-label-required">*</span></label>
                <textarea className="adm-textarea" rows={3} value={form.prompt_en} required
                  placeholder="Text read aloud in the IVR…"
                  onChange={(e) => set("prompt_en", e.target.value)} />
              </div>
              <div className="adm-field">
                <label className="adm-label">Prompt (Amharic / አማርኛ)</label>
                <textarea className="adm-textarea" rows={3} value={form.prompt_am}
                  placeholder="በአማርኛ የሚነበብ መመሪያ…"
                  onChange={(e) => set("prompt_am", e.target.value)} />
              </div>
            </div>

            {/* Action */}
            <div className="adm-form-row">
              <div className="adm-field">
                <label className="adm-label">Action Type</label>
                <select className="adm-select" value={form.action_type}
                  onChange={(e) => set("action_type", e.target.value)}>
                  <option value="navigate">Navigate — show sub-options</option>
                  <option value="connect_agent">Connect to Agent (call)</option>
                  <option value="callback">Collect Callback Number</option>
                  <option value="info">Info Display only</option>
                </select>
              </div>
              <div className="adm-field">
                <label className="adm-label">Action Target</label>
                <input className="adm-input" value={form.action_target}
                  placeholder="Extension, dept, URL…"
                  onChange={(e) => set("action_target", e.target.value)} />
              </div>
            </div>

            <div className="adm-field" style={{ maxWidth: 120 }}>
              <label className="adm-label">Sort Order</label>
              <input className="adm-input" type="number" value={form.sort_order}
                onChange={(e) => set("sort_order", e.target.value)} />
            </div>

            {/* Live preview */}
            <div className="adm-preview-card">
              <div className="adm-preview-label">👁  Live Preview in IVR Widget</div>
              <div className="adm-preview-ivr">
                <div className="adm-preview-num">{form.sort_order > 0 ? form.sort_order : "•"}</div>
                <div className="adm-preview-text">
                  <div className="adm-preview-node-label">{form.label_en || "(untitled)"}</div>
                  <div className="adm-preview-node-prompt">{form.prompt_en || "No prompt text set"}</div>
                  {form.action_type !== "navigate" && (
                    <span className={ACTION_BADGE_CLASS[form.action_type]} style={{ display: "inline-block", marginTop: 4 }}>
                      {ACTION_BADGE_LABEL[form.action_type]}{form.action_target ? ` → ${form.action_target}` : ""}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
              <button type="submit" className="adm-btn adm-btn-primary" disabled={saving}>
                <Ico name="Check" size={14} /> {saving ? "Saving…" : isNew ? "Create Node" : "Save Changes"}
              </button>
              <button type="button" className="adm-btn adm-btn-ghost" onClick={onCancel}>Cancel</button>
            </div>
          </div>
        </form>

        {/* Audio upload (existing nodes only) */}
        {editingNode && (
          <div className="adm-audio-panel">
            <div className="adm-card-title" style={{ fontSize: "0.85rem" }}>
              <span className="adm-card-title-icon amber"><Ico name="Music" size={14} /></span>
              Voice Audio File
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--adm-text-muted)", margin: 0 }}>
              Upload an MP3/WAV to replace browser speech synthesis for this node.
            </p>
            {editingNode.audio_url && (
              <div className="adm-audio-current">
                <div className="adm-audio-ok"><Ico name="Check" size={13} /> Audio configured</div>
                <audio src={`${API_URL}${editingNode.audio_url}`} controls style={{ height: 32, width: "100%" }} />
              </div>
            )}
            <form onSubmit={handleAudioUpload} style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="file" accept="audio/*" required style={{ flex: 1, fontSize: "0.8rem" }}
                onChange={(e) => { setAudioFile(e.target.files[0]); setAudioStatus(""); }} />
              <button type="submit" className="adm-btn adm-btn-primary adm-btn-sm" disabled={!audioFile}>Upload</button>
            </form>
            {audioStatus === "success" && <span style={{ fontSize: "0.78rem", color: "var(--adm-success)", display: "flex", alignItems: "center", gap: 4 }}><Ico name="Check" size={12} /> Uploaded</span>}
            {audioStatus === "error" && <span style={{ fontSize: "0.78rem", color: "var(--adm-danger)" }}>Upload failed. Check file type.</span>}
            {audioStatus === "uploading" && <span style={{ fontSize: "0.78rem", color: "var(--adm-text-muted)" }}>Uploading…</span>}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Analytics Page ────────────────────────────────────────────────────────────
const AnalyticsPage = ({ analytics, onRefresh }) => {
  const [sortKey, setSortKey] = useState("selection_count");
  const [sortDir, setSortDir] = useState(-1);

  if (!analytics) return (
    <div className="adm-empty-state">
      <div className="adm-empty-icon">📊</div>
      <div className="adm-empty-title">Loading analytics…</div>
      <div className="adm-empty-body">Fetching session and selection data from the server.</div>
    </div>
  );

  const toggleSort = (key) => { if (sortKey === key) setSortDir((d) => -d); else { setSortKey(key); setSortDir(-1); } };
  const sortedNodes = [...analytics.nodes].sort((a, b) => {
    const av = typeof a[sortKey] === "string" ? a[sortKey].localeCompare(b[sortKey]) : a[sortKey] - b[sortKey];
    return av * sortDir;
  });
  const dropoffClass = (rate) => rate < 0.25 ? "low" : rate < 0.6 ? "mid" : "high";
  const maxHit = Math.max(...analytics.nodes.map((n) => n.selection_count), 1);
  const si = (key) => sortKey === key ? (sortDir === -1 ? " ↓" : " ↑") : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="adm-stats-grid">
        <div className="adm-stat-card blue">
          <div className="adm-stat-label">Total Sessions</div>
          <div className="adm-stat-value">{analytics.total_sessions.toLocaleString()}</div>
          <div className="adm-stat-footer">All-time user sessions</div>
        </div>
        <div className="adm-stat-card purple">
          <div className="adm-stat-label">Total Selections</div>
          <div className="adm-stat-value">{analytics.total_selections.toLocaleString()}</div>
          <div className="adm-stat-footer">Menu option clicks recorded</div>
        </div>
        <div className="adm-stat-card green">
          <div className="adm-stat-label">Avg Session Depth</div>
          <div className="adm-stat-value">{analytics.avg_session_depth}</div>
          <div className="adm-stat-footer">Avg nodes visited per session</div>
        </div>
      </div>

      <div className="adm-card">
        <div className="adm-card-header">
          <div className="adm-card-title">
            <span className="adm-card-title-icon blue"><Ico name="Chart" size={14} /></span>
            Node Hit Frequency (Top 8)
          </div>
          <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={onRefresh}>Refresh</button>
        </div>
        <div className="adm-card-body">
          {analytics.nodes.length === 0 ? (
            <div className="adm-empty-state" style={{ padding: 24 }}>
              <div className="adm-empty-icon">🌐</div>
              <div className="adm-empty-title">No events yet</div>
              <div className="adm-empty-body">Start using the IVR to see analytics here.</div>
            </div>
          ) : (
            <div className="adm-chart-bars">
              {[...analytics.nodes].sort((a, b) => b.selection_count - a.selection_count).slice(0, 8).map((node) => {
                const pct = (node.selection_count / maxHit) * 100;
                return (
                  <div key={node.node_id} className="adm-chart-bar-wrap">
                    <span className="adm-chart-bar-value">{node.selection_count}</span>
                    <div className="adm-chart-bar" style={{ height: `${Math.max(pct * 0.8, 4)}%` }} />
                    <span className="adm-chart-bar-label">{node.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {analytics.nodes.length > 0 && (
        <div className="adm-card">
          <div className="adm-card-header">
            <div className="adm-card-title">
              <span className="adm-card-title-icon purple"><Ico name="Grid" size={14} /></span>
              Full Node Performance Table
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="adm-table">
              <thead>
                <tr>
                  <th onClick={() => toggleSort("label")}>Node Label{si("label")}</th>
                  <th onClick={() => toggleSort("selection_count")}>Hits{si("selection_count")}</th>
                  <th onClick={() => toggleSort("drop_off_count")}>Drop-offs{si("drop_off_count")}</th>
                  <th onClick={() => toggleSort("drop_off_rate")}>Drop-off Rate{si("drop_off_rate")}</th>
                </tr>
              </thead>
              <tbody>
                {sortedNodes.map((node) => (
                  <tr key={node.node_id}>
                    <td style={{ fontWeight: 500 }}>{node.label}</td>
                    <td style={{ color: "var(--adm-primary)", fontWeight: 700 }}>{node.selection_count}</td>
                    <td>{node.drop_off_count}</td>
                    <td><span className={`adm-dropoff-pill ${dropoffClass(node.drop_off_rate)}`}>{(node.drop_off_rate * 100).toFixed(1)}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Settings Page ─────────────────────────────────────────────────────────────
const SettingsPage = ({ onCreateUser, API_URL }) => {
  const [form, setForm] = useState({ email: "", password: "", role: "editor" });
  const [status, setStatus] = useState(null);
  const [msg, setMsg] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setStatus(null);
    try {
      await onCreateUser(form);
      setStatus("success"); setMsg(`Admin user "${form.email}" created.`);
      setForm({ email: "", password: "", role: "editor" });
    } catch (err) { setStatus("error"); setMsg(err?.response?.data?.detail || "Failed to create user."); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="adm-card" style={{ maxWidth: 520 }}>
        <div className="adm-card-header">
          <div className="adm-card-title">
            <span className="adm-card-title-icon purple"><Ico name="User" size={14} /></span>
            Create Admin User
          </div>
        </div>
        <div className="adm-card-body">
          {status === "success" && <div className="adm-audio-current" style={{ marginBottom: 16 }}><div className="adm-audio-ok"><Ico name="Check" size={13} /> {msg}</div></div>}
          {status === "error" && <div className="adm-login-error" style={{ marginBottom: 16 }}><Ico name="Alert" size={13} /> {msg}</div>}
          <form onSubmit={handleSubmit} className="adm-form-section">
            <div className="adm-field">
              <label className="adm-label">Email <span className="adm-label-required">*</span></label>
              <input className="adm-input" type="email" required value={form.email} placeholder="admin@company.com" onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className="adm-field">
              <label className="adm-label">Password <span className="adm-label-required">*</span></label>
              <input className="adm-input" type="password" required minLength={8} value={form.password} placeholder="Min. 8 characters" onChange={(e) => set("password", e.target.value)} />
            </div>
            <div className="adm-field">
              <label className="adm-label">Role</label>
              <select className="adm-select" value={form.role} onChange={(e) => set("role", e.target.value)}>
                <option value="editor">Editor</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <div><button type="submit" className="adm-btn adm-btn-primary"><Ico name="User" size={14} /> Create User</button></div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ─── Main AdminApp ─────────────────────────────────────────────────────────────
const AdminApp = () => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const [token, setToken] = useState(() => localStorage.getItem("admin_token"));
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [nodes, setNodes] = useState([]);
  const [flatNodes, setFlatNodes] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [activeTab, setActiveTab] = useState("builder");
  const [selectedNode, setSelectedNode] = useState(null);
  const [presetParentId, setPresetParentId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (token) { localStorage.setItem("admin_token", token); fetchNodes(); }
    else { localStorage.removeItem("admin_token"); setNodes([]); setFlatNodes([]); }
  }, [token]);

  useEffect(() => { if (token && activeTab === "analytics") fetchAnalytics(); }, [activeTab, token]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const buildFlat = (data) => {
    const flat = [];
    const go = (n) => { flat.push(n); n.children.forEach(go); };
    data.forEach(go);
    return flat;
  };

  const fetchNodes = async () => {
    try { const res = await client.get("/api/admin/nodes"); setNodes(res.data); setFlatNodes(buildFlat(res.data)); }
    catch (err) { console.error("fetchNodes", err); }
  };

  const fetchAnalytics = async () => {
    try { const res = await client.get("/api/admin/analytics"); setAnalytics(res.data); }
    catch (err) { console.error("fetchAnalytics", err); }
  };

  const handleLogin = async (e) => {
    e.preventDefault(); setLoginError("");
    try { const res = await client.post("/api/admin/login", { email: loginEmail, password: loginPassword }); setToken(res.data.access_token); }
    catch { setLoginError("Incorrect email or password."); }
  };

  const handleLogout = () => { setToken(null); setSelectedNode(null); };

  const handleSaveNode = async (editingNode, payload) => {
    if (editingNode) {
      await client.patch(`/api/admin/nodes/${editingNode.id}`, payload);
      showToast("Node updated.", "success");
    } else {
      await client.post("/api/admin/nodes", payload);
      showToast("Node created.", "success");
    }
    setSelectedNode(null); setPresetParentId(""); fetchNodes();
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    try {
      await client.delete(`/api/admin/nodes/${deleteTarget.id}`);
      showToast(`"${deleteTarget.labels.en}" deleted.`, "success");
      if (selectedNode?.id === deleteTarget.id) setSelectedNode(null);
      fetchNodes();
    } catch { showToast("Failed to delete.", "error"); }
    setDeleteTarget(null);
  };

  const handleAddChild = (parentNode) => {
    setSelectedNode(null);
    setPresetParentId(String(parentNode.id));
  };

  const handleMove = async (node, direction) => {
    const siblings = node.parent_id
      ? (flatNodes.find((n) => n.id === node.parent_id)?.children || [])
      : nodes;
    const idx = siblings.findIndex((n) => n.id === node.id);
    let target = null;
    if (direction === "up" && idx > 0) target = siblings[idx - 1];
    if (direction === "down" && idx < siblings.length - 1) target = siblings[idx + 1];
    if (!target) return;
    try {
      await client.post("/api/admin/nodes/reorder", {
        nodes: [
          { id: node.id, sort_order: node.sort_order === target.sort_order ? node.sort_order + 1 : target.sort_order },
          { id: target.id, sort_order: node.sort_order },
        ],
      });
      fetchNodes();
    } catch { showToast("Reorder failed.", "error"); }
  };

  const handleCreateUser = async (form) => { await client.post("/api/admin/users", form); };

  const handleSelectNode = (node) => { setSelectedNode(node); setPresetParentId(""); };

  // ── Login ──
  if (!token) {
    return (
      <div className="adm-login-root">
        <div className="adm-login-card">
          <div className="adm-login-logo">
            <img src="/skyservice-horizontal.png" alt="Skyservice" style={{ height: "40px", width: "auto", display: "block" }} />
          </div>
          <h2 className="adm-login-heading">Sign in to your account</h2>
          <p className="adm-login-desc">Enter your credentials to access the admin dashboard.</p>
          {loginError && <div className="adm-login-error" style={{ marginBottom: 16 }}><Ico name="Alert" size={14} /> {loginError}</div>}
          <form className="adm-login-form" onSubmit={handleLogin}>
            <div className="adm-field">
              <label className="adm-label" htmlFor="adm-email"><Ico name="Mail" size={13} /> Email Address</label>
              <input id="adm-email" className="adm-input" type="email" required autoComplete="email"
                placeholder="admin@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
            </div>
            <div className="adm-field">
              <label className="adm-label" htmlFor="adm-password"><Ico name="Lock" size={13} /> Password</label>
              <input id="adm-password" className="adm-input" type="password" required autoComplete="current-password"
                placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
            </div>
            <button type="submit" className="adm-btn adm-btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "10px 16px" }}>
              <Ico name="Lock" size={14} /> Sign In Securely
            </button>
          </form>
          <div style={{ marginTop: 24, textAlign: "center" }}>
            <a href="/" style={{ fontSize: "0.78rem", color: "var(--adm-text-muted)" }}>← Back to IVR Menu</a>
          </div>
        </div>
      </div>
    );
  }

  // ── Dashboard ──
  const navItems = [
    { id: "agent_hub",   label: "Agent Copilot",        icon: "User" },
    { id: "builder",     label: "Menu Builder",         icon: "Menu" },
    { id: "flow_canvas", label: "Decision Flow Canvas", icon: "Grid" },
    { id: "analytics",   label: "Analytics",            icon: "Chart" },
    { id: "settings",    label: "Settings",             icon: "Settings" },
  ];
  const tabTitles = {
    agent_hub: "SkyConnect Agent Copilot",
    builder: "Menu Flow Builder",
    flow_canvas: "Decision Tree Flow Canvas",
    analytics: "Live Analytics",
    settings: "Settings",
  };

  return (
    <div className="admin-root">
      <aside className="adm-sidebar">
        <div className="adm-sidebar-logo">
          <div className="adm-sidebar-logo-icon">
            <img src="/skyservice-icon.png" alt="Skyservice" style={{ width: "24px", height: "auto", display: "block" }} />
          </div>
          <div className="adm-sidebar-logo-text">
            <span className="adm-sidebar-logo-title">Skyservice</span>
            <span className="adm-sidebar-logo-sub">Customer Experience</span>
          </div>
        </div>
        <nav className="adm-nav">
          <div className="adm-nav-section-label">Manage</div>
          {navItems.map((item) => (
            <button key={item.id} className={`adm-nav-item${activeTab === item.id ? " active" : ""}`}
              onClick={() => setActiveTab(item.id)}>
              <span className="adm-nav-icon"><Ico name={item.icon} size={15} /></span>
              {item.label}
            </button>
          ))}
          <div className="adm-nav-section-label" style={{ marginTop: 8 }}>View</div>
          <button className="adm-nav-item" onClick={() => window.open("/", "_blank")}>
            <span className="adm-nav-icon"><Ico name="External" size={15} /></span>
            Open IVR Menu
          </button>
        </nav>
        <div className="adm-sidebar-footer">
          <button className="adm-nav-item" onClick={handleLogout}>
            <span className="adm-nav-icon"><Ico name="Logout" size={15} /></span>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="adm-main">
        <div className="adm-topbar">
          <div className="adm-topbar-left">
            <div className="adm-topbar-title">{tabTitles[activeTab]}</div>
            <div className="adm-topbar-breadcrumb">Admin Panel <span>›</span> {tabTitles[activeTab]}</div>
          </div>
          <div className="adm-topbar-actions">
            <div className="adm-admin-badge"><Ico name="User" size={12} /> Administrator</div>
            {activeTab === "builder" && (
              <button className="adm-btn adm-btn-primary adm-btn-sm"
                onClick={() => { setSelectedNode(null); setPresetParentId(""); }}>
                <Ico name="Plus" size={13} /> New Root Node
              </button>
            )}
            {activeTab === "analytics" && (
              <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={fetchAnalytics}>Refresh Data</button>
            )}
          </div>
        </div>

        <div className="adm-page">
          {activeTab === "builder" && (
            <div className="adm-builder-grid">
              {/* Tree */}
              <div className="adm-card">
                <div className="adm-card-header">
                  <div className="adm-card-title">
                    <span className="adm-card-title-icon blue"><Ico name="Menu" size={14} /></span>
                    Menu Hierarchy
                    <span className="adm-badge adm-badge-navigate" style={{ marginLeft: 6 }}>{flatNodes.length} nodes</span>
                  </div>
                  <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={fetchNodes}>Reload</button>
                </div>
                <div className="adm-tree-scroll" style={{ padding: "8px 12px" }}>
                  {nodes.length === 0 ? (
                    <div className="adm-empty-state">
                      <div className="adm-empty-icon">🌳</div>
                      <div className="adm-empty-title">No nodes yet</div>
                      <div className="adm-empty-body">Create your first root node using the editor on the right.</div>
                    </div>
                  ) : (
                    nodes.map((node) => (
                      <TreeNode key={node.id} node={node} depth={0}
                        selectedId={selectedNode?.id} siblings={nodes}
                        onSelect={handleSelectNode}
                        onDelete={(n) => setDeleteTarget(n)}
                        onAddChild={handleAddChild}
                        onMove={handleMove} />
                    ))
                  )}
                </div>
                <div style={{ padding: "10px 16px", borderTop: "1px solid var(--adm-border)", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: "0.68rem", color: "var(--adm-text-muted)", fontWeight: 600, marginRight: 2 }}>Types:</span>
                  {Object.entries(ACTION_BADGE_LABEL).map(([k, v]) => (
                    <span key={k} className={ACTION_BADGE_CLASS[k]}>{v}</span>
                  ))}
                </div>
              </div>

              {/* Editor */}
              <NodeEditor
                editingNode={selectedNode}
                presetParentId={presetParentId}
                flatNodes={flatNodes}
                onSave={handleSaveNode}
                onCancel={() => { setSelectedNode(null); setPresetParentId(""); }}
                API_URL={API_URL}
              />
            </div>
          )}

          {activeTab === "agent_hub" && <AgentCopilotHub />}
          {activeTab === "flow_canvas" && <FlowCanvas />}
          {activeTab === "analytics" && <AnalyticsPage analytics={analytics} onRefresh={fetchAnalytics} />}
          {activeTab === "settings" && <SettingsPage onCreateUser={handleCreateUser} API_URL={API_URL} />}
        </div>
      </main>

      {deleteTarget && (
        <DeleteModal node={deleteTarget} onConfirm={handleDeleteConfirmed} onCancel={() => setDeleteTarget(null)} />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
};

export default AdminApp;
