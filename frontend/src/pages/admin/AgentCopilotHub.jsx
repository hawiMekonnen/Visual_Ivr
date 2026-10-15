import React, { useState } from "react";

const AgentCopilotHub = () => {
  const [agentStatus, setAgentStatus] = useState("available");
  const [queues, setQueues] = useState([
    { id: "voice",    name: "Voice",     count: 12, color: "#22C55E", active: true },
    { id: "video",    name: "Video",     count: 1,  color: "#0284C7", active: true },
    { id: "whatsapp", name: "WhatsApp",  count: 4,  color: "#22C55E", active: true },
    { id: "telegram", name: "Telegram",  count: 2,  color: "#0284C7", active: true },
    { id: "facebook", name: "Facebook",  count: 3,  color: "#0D5E36", active: true },
    { id: "webchat",  name: "Web chat",  count: 2,  color: "#84CC16", active: true },
    { id: "sms",      name: "SMS",       count: 0,  color: "#6B7280", active: false },
  ]);

  const [copilotActionMsg, setCopilotActionMsg] = useState("");

  const handleSimulateAction = (action) => {
    setCopilotActionMsg(`Copilot: Generated response template for ${action}`);
    setTimeout(() => setCopilotActionMsg(""), 4000);
  };

  return (
    <div className="agent-hub-root">
      {/* ── Top Header & Status ── */}
      <div className="agent-hub-header">
        <div className="agent-hub-greeting-col">
          <h2 className="agent-hub-greeting">Good morning, Hana</h2>
          <span className="agent-hub-sub">Visual IVR & SkyConnect Agent Experience</span>
        </div>

        <div className="agent-status-toggles">
          <button
            className={`agent-status-btn status-avail ${agentStatus === "available" ? "active" : ""}`}
            onClick={() => setAgentStatus("available")}
          >
            <span className="status-dot-green" />
            Available
          </button>
          <button
            className={`agent-status-btn status-break ${agentStatus === "break" ? "active" : ""}`}
            onClick={() => setAgentStatus("break")}
          >
            Break
          </button>
          <button
            className={`agent-status-btn status-off ${agentStatus === "offline" ? "active" : ""}`}
            onClick={() => setAgentStatus("offline")}
          >
            Offline
          </button>
        </div>
      </div>

      {copilotActionMsg && (
        <div className="agent-toast-notice">
          ✨ {copilotActionMsg}
        </div>
      )}

      {/* ── 3 Metric Cards (Image 2 style) ── */}
      <div className="agent-metrics-row">
        <div className="agent-metric-card">
          <div className="agent-metric-number">18</div>
          <div className="agent-metric-label">Calls and chats today</div>
        </div>

        <div className="agent-metric-card">
          <div className="agent-metric-number">04:10</div>
          <div className="agent-metric-label">Average handle time</div>
        </div>

        <div className="agent-metric-card">
          <div className="agent-metric-number">4.6</div>
          <div className="agent-metric-label">CSAT today</div>
        </div>
      </div>

      {/* ── Main Two-Column Grid (Image 2 style) ── */}
      <div className="agent-hub-grid">
        {/* Left Column: My queues by channel */}
        <div className="agent-hub-card queue-card">
          <div className="agent-hub-card-header">
            <h3 className="agent-card-title">My queues by channel</h3>
            <span className="agent-queue-total">24 In Queue</span>
          </div>

          <div className="agent-queue-list">
            {queues.map((q) => (
              <div key={q.id} className="agent-queue-item">
                <div className="agent-queue-left">
                  <span
                    className="agent-channel-dot"
                    style={{ backgroundColor: q.color }}
                  />
                  <span className="agent-channel-name">{q.name}</span>
                </div>
                <div className="agent-queue-right">
                  <span className={`agent-waiting-pill ${q.count > 0 ? "blue" : "gray"}`}>
                    {q.count} waiting
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: AI Copilot & Today Schedule */}
        <div className="agent-hub-right-col">
          {/* AI Copilot Dark Forest Green Card */}
          <div className="agent-copilot-card">
            <div className="copilot-card-header">
              <span className="copilot-sparkle">✦</span>
              <h3 className="copilot-title">AI copilot</h3>
            </div>

            <div className="copilot-content-list">
              <div
                className="copilot-item interactive"
                onClick={() => handleSimulateAction("Telebirr Wrong Transfer reversal")}
              >
                <div className="copilot-item-label">Top issue today:</div>
                <div className="copilot-item-text">telebirr wrong transfers</div>
                <span className="copilot-action-badge">Auto-assist ›</span>
              </div>

              <div className="copilot-item">
                <div className="copilot-item-label">Coaching focus:</div>
                <div className="copilot-item-text">empathy (Thu 10:30)</div>
              </div>

              <div
                className="copilot-item interactive"
                onClick={() => handleSimulateAction("SIM swap KB article")}
              >
                <div className="copilot-item-label">New article:</div>
                <div className="copilot-item-text">SIM swap updated</div>
                <span className="copilot-action-badge">View Article ›</span>
              </div>
            </div>
          </div>

          {/* Today Card */}
          <div className="agent-hub-card today-card">
            <h3 className="agent-card-title">Today</h3>

            <div className="today-schedule-list">
              <div className="schedule-row">
                <span className="schedule-time">08:00</span>
                <span className="schedule-desc">Shift start</span>
              </div>
              <div className="schedule-row highlight">
                <span className="schedule-time">10:30</span>
                <span className="schedule-desc">Coaching, 15 min</span>
              </div>
              <div className="schedule-row">
                <span className="schedule-time">14:00</span>
                <span className="schedule-desc">Training: telebirr</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Brand Bottom Bar (Image 2 style) ── */}
      <div className="agent-hub-footer">
        <div className="agent-footer-brand">
          <img src="/skyservice-horizontal.png" alt="Skyservice" className="agent-footer-logo" />
          <span className="agent-footer-sep">|</span>
          <span className="agent-footer-text">SkyConnect Customer and Agent Experience</span>
        </div>
        <div className="agent-footer-status">
          <span className="status-live-indicator" /> Ethio Telecom Unified IVR Gateway Connected
        </div>
      </div>
    </div>
  );
};

export default AgentCopilotHub;
