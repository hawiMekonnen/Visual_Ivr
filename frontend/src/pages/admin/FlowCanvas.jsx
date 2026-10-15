import React, { useState, useEffect, useCallback } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  MarkerType,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import client from "../../api/client";

// ── Custom Decision Tree Node Card (White / Light Theme) ───────────────────
const DecisionFlowNode = ({ data, selected }) => {
  const typeStyles = {
    menu: {
      border: "#0284c7",
      headerBg: "#f0f9ff",
      badge: "#0284c7",
      icon: "🧭",
      label: "Menu",
    },
    subflow: {
      border: "#6366f1",
      headerBg: "#eef2ff",
      badge: "#6366f1",
      icon: "🔀",
      label: "Subflow",
    },
    transfer: {
      border: "#e11d48",
      headerBg: "#fff1f2",
      badge: "#e11d48",
      icon: "🎧",
      label: "Transfer",
    },
    info: {
      border: "#059669",
      headerBg: "#ecfdf5",
      badge: "#059669",
      icon: "ℹ️",
      label: "Info",
    },
    exit: {
      border: "#64748b",
      headerBg: "#f8fafc",
      badge: "#64748b",
      icon: "⏹️",
      label: "Exit",
    },
  };

  const style = typeStyles[data.type] || typeStyles.subflow;

  return (
    <div
      style={{
        background: "#ffffff",
        border: `2px solid ${selected ? "#2563eb" : style.border}`,
        borderRadius: "10px",
        width: "270px",
        color: "#0f172a",
        fontFamily: "inherit",
        boxShadow: selected
          ? `0 0 0 3px rgba(37,99,235,0.25), 0 10px 25px rgba(0,0,0,0.08)`
          : "0 4px 14px rgba(0,0,0,0.06)",
        transition: "all 0.15s ease",
        cursor: "grab",
        overflow: "hidden",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: style.border, width: 10, height: 10, border: "2px solid #ffffff" }}
      />

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "9px 12px",
          background: style.headerBg,
          borderBottom: `1px solid ${style.border}33`,
        }}
      >
        <span style={{ fontSize: "0.86rem", fontWeight: "700", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
          <span>{style.icon}</span> {data.title || data.id}
        </span>
        <span
          style={{
            fontSize: "0.65rem",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            background: style.badge,
            color: "#ffffff",
            padding: "2px 7px",
            borderRadius: "4px",
            fontWeight: "700",
          }}
        >
          {data.type || style.label}
        </span>
      </div>

      {/* Body / Prompt text preview */}
      <div style={{ padding: "10px 12px" }}>
        <p
          style={{
            fontSize: "0.78rem",
            color: "#475569",
            margin: "0 0 8px 0",
            lineHeight: "1.4",
            maxHeight: "44px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {data.prompt_en || "(No English prompt)"}
        </p>

        {/* Action Pill */}
        {data.action && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "0.7rem",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              padding: "2px 8px",
              borderRadius: "12px",
              color: "#1d4ed8",
              fontWeight: "600",
            }}
          >
            {data.action.action_type === "connect_agent"
              ? "📞 Live Agent Transfer"
              : `🧭 ${data.action.label || data.action.action_type}`}
          </div>
        )}

        {/* Transition count preview */}
        <div style={{ fontSize: "0.68rem", color: "#64748b", marginTop: "6px", fontWeight: "500" }}>
          {Object.keys(data.transitions || {}).length} Intent Branches
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: style.border, width: 10, height: 10, border: "2px solid #ffffff" }}
      />
    </div>
  );
};

const nodeTypes = {
  avayaNode: DecisionFlowNode,
};

// ── Flow Canvas Inner Component ────────────────────────────────────────────
const FlowCanvasInner = () => {
  const { fitView, getViewport, setViewport } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeData, setSelectedNodeData] = useState(null);
  const [rawConfig, setRawConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(""); // "" | "saving" | "saved" | "error"
  const [translating, setTranslating] = useState(false);

  // Auto-translate English prompt & title to Amharic
  const handleAutoTranslateNode = async () => {
    if (!selectedNodeData?.prompt_en && !selectedNodeData?.title) return;
    setTranslating(true);
    try {
      const res = await client.post("/api/translate/node-fields", {
        label_en: selectedNodeData.title || selectedNodeData.id,
        prompt_en: selectedNodeData.prompt_en || "",
        target_lang: "am",
      });
      if (res.data && res.data.prompt_text) {
        handleNodeFieldChange("prompt_am", res.data.prompt_text);
      }
    } catch (err) {
      console.error("Auto-translation failed:", err);
    } finally {
      setTranslating(false);
    }
  };

  // Directional Pan helper (nudge workspace up/down/left/right)
  const handlePan = (dx, dy) => {
    const { x, y, zoom } = getViewport();
    setViewport({ x: x + dx, y: y + dy, zoom }, { duration: 250 });
  };

  // Fetch flows from backend
  const fetchFlows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get("/api/admin/flows");
      const config = res.data || {};
      setRawConfig(config);

      const nodesDict = config.nodes || {};
      const generatedNodes = [];
      const generatedEdges = [];

      // Convert config dict into ReactFlow Nodes & Edges
      Object.keys(nodesDict).forEach((nodeId) => {
        const nodeItem = nodesDict[nodeId];
        const pos = nodeItem.position || {
          x: Math.random() * 400 + 100,
          y: Math.random() * 400 + 100,
        };

        generatedNodes.push({
          id: nodeId,
          type: "avayaNode",
          position: pos,
          data: {
            id: nodeId,
            ...nodeItem,
          },
        });

        // Generate Edges for Transitions
        const transitions = nodeItem.transitions || {};
        Object.keys(transitions).forEach((intentKey) => {
          const targetId = transitions[intentKey];
          if (nodesDict[targetId]) {
            const isAgent = targetId === "flow_agent_transfer";
            generatedEdges.push({
              id: `e-${nodeId}-${targetId}-${intentKey}`,
              source: nodeId,
              target: targetId,
              label: intentKey,
              animated: isAgent,
              style: {
                stroke: isAgent ? "#e11d48" : "#2563eb",
                strokeWidth: 2,
              },
              labelStyle: { fill: "#0f172a", fontSize: 10, fontWeight: 700 },
              labelBgStyle: { fill: "#ffffff", fillOpacity: 0.95, rx: 4, ry: 4, stroke: "#cbd5e1", strokeWidth: 1 },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: isAgent ? "#e11d48" : "#2563eb",
              },
            });
          }
        });
      });

      setNodes(generatedNodes);
      setEdges(generatedEdges);

      setTimeout(() => {
        fitView({ padding: 0.25, duration: 400 });
      }, 100);
    } catch (err) {
      console.error("Failed to load flows:", err);
    } finally {
      setLoading(false);
    }
  }, [setNodes, setEdges, fitView]);

  useEffect(() => {
    fetchFlows();
  }, [fetchFlows]);

  // Handle Node Click to inspect
  const onNodeClick = useCallback((_, node) => {
    setSelectedNodeData(node.data);
  }, []);

  // Handle Edge connection
  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: "#2563eb", strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#2563eb" },
            labelBgStyle: { fill: "#ffffff", stroke: "#cbd5e1" },
          },
          eds
        )
      ),
    [setEdges]
  );

  // Update selected node field in state
  const handleNodeFieldChange = (field, value) => {
    if (!selectedNodeData) return;
    const updated = { ...selectedNodeData, [field]: value };
    setSelectedNodeData(updated);

    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === selectedNodeData.id) {
          return {
            ...n,
            data: { ...n.data, [field]: value },
          };
        }
        return n;
      })
    );
  };

  // Add a new transition branch to selected node
  const handleAddTransition = (intentName, targetNodeId) => {
    if (!selectedNodeData || !intentName || !targetNodeId) return;
    const newTransitions = {
      ...(selectedNodeData.transitions || {}),
      [intentName]: targetNodeId,
    };
    handleNodeFieldChange("transitions", newTransitions);

    // Add new edge visually
    setEdges((eds) => [
      ...eds,
      {
        id: `e-${selectedNodeData.id}-${targetNodeId}-${intentName}`,
        source: selectedNodeData.id,
        target: targetNodeId,
        label: intentName,
        style: { stroke: "#2563eb", strokeWidth: 2 },
        labelStyle: { fill: "#0f172a", fontSize: 10, fontWeight: 700 },
        labelBgStyle: { fill: "#ffffff", stroke: "#cbd5e1" },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#2563eb" },
      },
    ]);
  };

  // Delete a transition branch
  const handleDeleteTransition = (intentName) => {
    if (!selectedNodeData || !selectedNodeData.transitions) return;
    const newTransitions = { ...selectedNodeData.transitions };
    delete newTransitions[intentName];
    handleNodeFieldChange("transitions", newTransitions);

    setEdges((eds) =>
      eds.filter((e) => !(e.source === selectedNodeData.id && e.label === intentName))
    );
  };

  // Save All Changes to Backend
  const handleSaveToBackend = async () => {
    setSaveStatus("saving");
    try {
      const newNodesDict = {};
      nodes.forEach((n) => {
        newNodesDict[n.id] = {
          ...n.data,
          position: n.position,
        };
      });

      const updatedConfig = {
        root_node: rawConfig?.root_node || "main_menu",
        global_handlers: rawConfig?.global_handlers || {},
        nodes: newNodesDict,
      };

      await client.post("/api/admin/flows", updatedConfig);
      setRawConfig(updatedConfig);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2500);
    } catch (err) {
      console.error("Save flows error:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(""), 3000);
    }
  };

  // Auto-Arrange Layout Hierarchically
  const handleAutoArrange = () => {
    const defaultPositions = {
      main_menu: { x: 600, y: 40 },
      flow_airtime: { x: 20, y: 320 },
      flow_internet: { x: 420, y: 320 },
      flow_telebirr: { x: 820, y: 320 },
      flow_sim_puk: { x: 1220, y: 320 },
      flow_broadband: { x: 120, y: 600 },
      flow_network: { x: 520, y: 600 },
      flow_shops: { x: 920, y: 600 },
      flow_agent_transfer: { x: 320, y: 880 },
      flow_exit: { x: 720, y: 880 },
    };

    setNodes((nds) =>
      nds.map((n, i) => {
        const standardPos = defaultPositions[n.id] || {
          x: (i % 3) * 380 + 100,
          y: Math.floor(i / 3) * 260 + 900,
        };
        return {
          ...n,
          position: standardPos,
        };
      })
    );

    setTimeout(() => {
      fitView({ padding: 0.25, duration: 500 });
    }, 50);
  };

  // Add New Flow Node
  const handleAddNewNode = () => {
    const newId = `flow_node_${Date.now() % 10000}`;
    const newNodeData = {
      id: newId,
      type: "subflow",
      title: "New Dialog Step",
      prompt_en: "Please choose an option to continue.",
      prompt_am: "እባክዎ ለመቀጠል አማራጭ ይምረጡ።",
      transitions: {
        main_menu: "main_menu",
      },
      quick_replies_en: ["Main Menu", "Speak with Agent"],
      quick_replies_am: ["ዋና ምናሌ", "ከወኪል ጋር ተነጋገር"],
      action: {
        action_type: "navigate",
        target: "Main Menu",
        label: "Return Home",
      },
      max_nomatch: 2,
    };

    const newNode = {
      id: newId,
      type: "avayaNode",
      position: { x: 350, y: 350 },
      data: newNodeData,
    };

    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeData(newNodeData);
  };

  // Delete Flow Node
  const handleDeleteNode = (nodeId) => {
    if (!nodeId) return;
    if (nodeId === "main_menu") {
      alert("The Root Main Menu node cannot be deleted.");
      return;
    }

    if (window.confirm(`Are you sure you want to delete node "${selectedNodeData?.title || nodeId}"?`)) {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setSelectedNodeData(null);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 120px)",
        background: "#ffffff",
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
      }}
    >
      {/* ── Visual Flow Canvas ─────────────────────────────────────────── */}
      <div style={{ flex: 1, position: "relative", background: "#f8fafc", cursor: "grab" }}>
        {/* Canvas Toolbar */}
        <div
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(12px)",
            padding: "8px 14px",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          }}
        >
          <button
            onClick={handleAddNewNode}
            style={{
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              padding: "7px 14px",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              boxShadow: "0 2px 6px rgba(37,99,235,0.2)",
            }}
          >
            + Add Flow Node
          </button>

          <button
            onClick={handleAutoArrange}
            style={{
              background: "#f1f5f9",
              color: "#1e293b",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              padding: "7px 12px",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
            title="Automatically space out nodes cleanly"
          >
            ✨ Auto-Arrange
          </button>

          <button
            onClick={() => fitView({ padding: 0.25, duration: 400 })}
            style={{
              background: "#f1f5f9",
              color: "#334155",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              padding: "7px 12px",
              fontSize: "0.82rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
            title="Fit all nodes to screen"
          >
            🔍 Fit Screen
          </button>

          {/* Directional Nudge Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "2px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "2px 4px" }}>
            <button onClick={() => handlePan(0, 180)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem", padding: "2px 6px" }} title="Move Workspace Up">⬆️</button>
            <button onClick={() => handlePan(0, -180)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem", padding: "2px 6px" }} title="Move Workspace Down">⬇️</button>
            <button onClick={() => handlePan(180, 0)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem", padding: "2px 6px" }} title="Move Workspace Left">⬅️</button>
            <button onClick={() => handlePan(-180, 0)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem", padding: "2px 6px" }} title="Move Workspace Right">➡️</button>
          </div>

          <button
            onClick={handleSaveToBackend}
            disabled={saveStatus === "saving"}
            style={{
              background: saveStatus === "saved" ? "#16a34a" : "#059669",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              padding: "7px 16px",
              fontSize: "0.82rem",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 6px rgba(5,150,105,0.2)",
            }}
          >
            {saveStatus === "saving" && "Saving…"}
            {saveStatus === "saved" && "✓ Saved Live!"}
            {saveStatus === "error" && "⚠ Failed"}
            {!saveStatus && "💾 Save Decision Tree"}
          </button>
        </div>

        {/* ReactFlow Canvas */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          colorMode="light"
          panOnDrag={true}
          panOnScroll={true}
          panOnScrollMode="free"
          zoomOnScroll={false}
          zoomOnPinch={true}
          zoomOnDoubleClick={false}
          nodesDraggable={true}
          elementsSelectable={true}
          selectionOnDrag={false}
          preventScrolling={false}
          minZoom={0.2}
          maxZoom={2.5}
        >
          <Background color="#cbd5e1" gap={24} size={1.5} />
          <Controls style={{ background: "#ffffff", border: "1px solid #e2e8f0", color: "#0f172a" }} />
          <MiniMap
            nodeColor={(n) => {
              if (n.data?.type === "transfer") return "#e11d48";
              if (n.data?.type === "menu") return "#0284c7";
              return "#6366f1";
            }}
            style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px" }}
          />
        </ReactFlow>
      </div>

      {/* ── Right Inspector Panel (Clean Light Theme) ───────────────────── */}
      <div
        style={{
          width: "370px",
          background: "#ffffff",
          borderLeft: "1px solid #e2e8f0",
          padding: "18px",
          overflowY: "auto",
          color: "#0f172a",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
            borderBottom: "1px solid #e2e8f0",
            paddingBottom: "10px",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "1.05rem", color: "#0f172a", fontWeight: "700" }}>
            Decision Node Inspector
          </h3>
        </div>

        {selectedNodeData ? (
          <div>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                Node Identifier (ID)
              </label>
              <input
                type="text"
                value={selectedNodeData.id || ""}
                disabled
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  background: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  color: "#64748b",
                  fontSize: "0.85rem",
                  fontWeight: "500",
                }}
              />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "0.75rem", color: "#475569", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                Node Title
              </label>
              <input
                type="text"
                value={selectedNodeData.title || ""}
                onChange={(e) => handleNodeFieldChange("title", e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  color: "#0f172a",
                  fontSize: "0.85rem",
                }}
              />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "0.75rem", color: "#475569", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                Node Category / Type
              </label>
              <select
                value={selectedNodeData.type || "subflow"}
                onChange={(e) => handleNodeFieldChange("type", e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  color: "#0f172a",
                  fontSize: "0.85rem",
                }}
              >
                <option value="menu">Menu (Entry Point)</option>
                <option value="subflow">Sub-Flow Dialog Step</option>
                <option value="transfer">Live Agent Transfer</option>
                <option value="info">Info / Announcement</option>
                <option value="exit">Exit / End</option>
              </select>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "0.75rem", color: "#475569", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                English Spoken Prompt (Text-to-Speech)
              </label>
              <textarea
                rows={3}
                value={selectedNodeData.prompt_en || ""}
                onChange={(e) => handleNodeFieldChange("prompt_en", e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  color: "#0f172a",
                  fontSize: "0.85rem",
                  resize: "vertical",
                  lineHeight: "1.4",
                }}
              />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                <label style={{ fontSize: "0.75rem", color: "#475569", fontWeight: "600" }}>
                  Amharic Spoken Prompt (አማርኛ)
                </label>
                <button
                  type="button"
                  onClick={handleAutoTranslateNode}
                  disabled={translating || !selectedNodeData.prompt_en}
                  style={{
                    background: translating ? "#f1f5f9" : "#eff6ff",
                    color: translating ? "#64748b" : "#2563eb",
                    border: "1px solid #bfdbfe",
                    borderRadius: "4px",
                    padding: "3px 8px",
                    fontSize: "0.72rem",
                    fontWeight: "600",
                    cursor: translating || !selectedNodeData.prompt_en ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    transition: "all 0.15s ease",
                  }}
                  title="Auto-translate English text to Amharic"
                >
                  {translating ? "Translating…" : "✨ Translate to Amharic"}
                </button>
              </div>
              <textarea
                rows={3}
                value={selectedNodeData.prompt_am || ""}
                onChange={(e) => handleNodeFieldChange("prompt_am", e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  color: "#0f172a",
                  fontSize: "0.85rem",
                  resize: "vertical",
                  lineHeight: "1.4",
                }}
              />
            </div>

            {/* Transitions / Intent Branches Section */}
            <div style={{ marginBottom: "16px", borderTop: "1px solid #e2e8f0", paddingTop: "12px" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#2563eb", display: "block", marginBottom: "8px" }}>
                Intent Branches / Transitions
              </label>

              {Object.keys(selectedNodeData.transitions || {}).map((intentKey) => (
                <div
                  key={intentKey}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 10px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    marginBottom: "6px",
                    fontSize: "0.75rem",
                  }}
                >
                  <div>
                    <span style={{ color: "#4338ca", fontWeight: 700 }}>{intentKey}</span>
                    <span style={{ color: "#94a3b8", margin: "0 6px" }}>➔</span>
                    <span style={{ color: "#0284c7", fontWeight: 600 }}>{selectedNodeData.transitions[intentKey]}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteTransition(intentKey)}
                    style={{ background: "none", border: "none", color: "#e11d48", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold" }}
                    title="Remove branch"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* Add Transition Form */}
              <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                <input
                  id="new-intent-input"
                  placeholder="Intent (e.g. telebirr_services)"
                  style={{
                    flex: 1,
                    padding: "6px 8px",
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    borderRadius: "4px",
                    color: "#0f172a",
                    fontSize: "0.75rem",
                  }}
                />
                <select
                  id="new-target-select"
                  style={{
                    flex: 1,
                    padding: "6px 8px",
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    borderRadius: "4px",
                    color: "#0f172a",
                    fontSize: "0.75rem",
                  }}
                >
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.data.title || n.id}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    const intentInp = document.getElementById("new-intent-input");
                    const targetInp = document.getElementById("new-target-select");
                    if (intentInp && targetInp && intentInp.value.trim()) {
                      handleAddTransition(intentInp.value.trim(), targetInp.value);
                      intentInp.value = "";
                    }
                  }}
                  style={{
                    background: "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    padding: "0 10px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Error NOMATCH Limit */}
            <div style={{ marginBottom: "18px" }}>
              <label style={{ fontSize: "0.75rem", color: "#475569", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                Max Retry Limit Before Agent Escalation
              </label>
              <input
                type="number"
                min={1}
                max={5}
                value={selectedNodeData.max_nomatch || 2}
                onChange={(e) => handleNodeFieldChange("max_nomatch", parseInt(e.target.value) || 2)}
                style={{
                  width: "80px",
                  padding: "6px 10px",
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  color: "#0f172a",
                  fontSize: "0.85rem",
                }}
              />
            </div>

            {/* Delete Node Button */}
            {selectedNodeData.id !== "main_menu" && (
              <div style={{ borderTop: "1px solid #fee2e2", paddingTop: "14px", marginTop: "14px" }}>
                <button
                  onClick={() => handleDeleteNode(selectedNodeData.id)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    background: "#fff1f2",
                    color: "#e11d48",
                    border: "1px solid #fecdd3",
                    padding: "9px 14px",
                    borderRadius: "8px",
                    fontSize: "0.82rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#ffe4e6";
                    e.currentTarget.style.borderColor = "#fda4af";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#fff1f2";
                    e.currentTarget.style.borderColor = "#fecdd3";
                  }}
                >
                  🗑️ Delete This Node
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: "#64748b", fontSize: "0.85rem", textAlign: "center", marginTop: "50px", lineHeight: "1.5" }}>
            <p style={{ fontSize: "2.2rem", margin: "0 0 10px 0" }}>👆</p>
            Select any node on the canvas to inspect and edit its dialog flow parameters, spoken prompts, and intent branches.
          </div>
        )}
      </div>
    </div>
  );
};

const FlowCanvas = () => (
  <ReactFlowProvider>
    <FlowCanvasInner />
  </ReactFlowProvider>
);

export default FlowCanvas;
