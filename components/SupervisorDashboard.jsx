"use client";

import React from "react";
import { 
  Users, Activity, CheckCircle2, Clock, 
  ShieldAlert, Headphones, Radio, ArrowRight, Zap, Award
} from "lucide-react";

export default function SupervisorDashboard({ agentsList, metrics }) {
  return (
    <div style={{ maxWidth: "1280px", margin: "16px auto", padding: "0 16px" }}>
      
      {/* Top Banner */}
      <div className="glass-panel supervisor-banner" style={{ padding: "24px 28px", marginBottom: "20px", backgroundColor: "#ffffff" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "#faf5ff", padding: "4px 12px", borderRadius: "20px", color: "#7e22ce", fontSize: "12px", fontWeight: "700", marginBottom: "6px", border: "1px solid #e9d5ff" }}>
              <Activity size={14} />
              BPO Operations Center
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>
              Live Support Fleet & Queue Dispatch Supervisor
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "2px" }}>
              Monitoring agent availability, active sessions, and first-to-claim queue routing in real time.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Dispatch Protocol:</span>
            <span style={{ fontSize: "12px", fontWeight: "700", padding: "6px 14px", borderRadius: "8px", backgroundColor: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0" }}>
              ⚡ Parallel Broadcast (First Claim Wins)
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="supervisor-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "20px" }}>
        
        <div className="glass-panel" style={{ padding: "20px", backgroundColor: "#ffffff" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>Free Agents (Available)</span>
            <span style={{ padding: "6px", borderRadius: "8px", backgroundColor: "#ecfdf5", color: "#059669" }}><Users size={18} /></span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#059669" }}>
            {metrics?.availableAgents || 0}
            <span style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-muted)", marginLeft: "6px" }}>
              / {metrics?.totalAgents || 4} total
            </span>
          </div>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
            Eligible to receive broadcasted requests
          </span>
        </div>

        <div className="glass-panel" style={{ padding: "20px", backgroundColor: "#ffffff" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>Waiting Queue</span>
            <span style={{ padding: "6px", borderRadius: "8px", backgroundColor: "#fffbeb", color: "#d97706" }}><Clock size={18} /></span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: metrics?.waitingChats > 0 ? "#d97706" : "#0f172a" }}>
            {metrics?.waitingChats || 0}
          </div>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
            Broadcasting to free agents
          </span>
        </div>

        <div className="glass-panel" style={{ padding: "20px", backgroundColor: "#ffffff" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>Active Chat Sessions</span>
            <span style={{ padding: "6px", borderRadius: "8px", backgroundColor: "#eff6ff", color: "#2563eb" }}><Headphones size={18} /></span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#2563eb" }}>
            {metrics?.activeChats || 0}
          </div>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
            Ongoing 1-on-1 customer resolutions
          </span>
        </div>

        <div className="glass-panel" style={{ padding: "20px", backgroundColor: "#ffffff" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>Total Resolved Today</span>
            <span style={{ padding: "6px", borderRadius: "8px", backgroundColor: "#faf5ff", color: "#7c3aed" }}><CheckCircle2 size={18} /></span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#7c3aed" }}>
            {35 + (metrics?.resolvedChats || 0)}
          </div>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
            Avg resolution time: 4m 12s
          </span>
        </div>

      </div>

      {/* Fleet Roster Table / Cards */}
      <div className="glass-panel" style={{ padding: "24px", marginBottom: "20px", backgroundColor: "#ffffff" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginBottom: "16px" }}>
          Support Agent Fleet Status
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
          {agentsList?.map((ag) => {
            const isAvailable = ag.status === "available";
            const isInChat = ag.status === "in_chat";
            const isBusy = ag.status === "busy";

            return (
              <div
                key={ag.id}
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  backgroundColor: "#f8fafc",
                  border: isAvailable ? "1px solid #a7f3d0" : isInChat ? "1px solid #bfdbfe" : "1px solid var(--border-color)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  boxShadow: "var(--shadow-sm)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <img
                    src={ag.avatar}
                    alt={ag.name}
                    style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover", border: "2px solid #e2e8f0" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>{ag.name}</h4>
                      <span className={`status-indicator status-${ag.status}`} />
                    </div>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block" }}>{ag.role}</span>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{ag.department} Dept</span>
                  </div>
                </div>

                <div style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  backgroundColor: isAvailable ? "#ecfdf5" : isInChat ? "#eff6ff" : "#fffbeb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "12px"
                }}>
                  <span style={{ color: "var(--text-secondary)" }}>State:</span>
                  <strong style={{
                    color: isAvailable ? "#059669" : isInChat ? "#2563eb" : isBusy ? "#d97706" : "var(--text-muted)",
                    textTransform: "capitalize"
                  }}>
                    {isAvailable ? "🟢 Free (Available)" : isInChat ? "🔵 In Active Chat" : isBusy ? "🟡 Away / Paused" : "Offline"}
                  </strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", paddingTop: "4px" }}>
                  <span>Resolved Today: <strong style={{ color: "#0f172a" }}>{ag.stats?.resolvedToday || 0}</strong></span>
                  <span>Avg Rating: <strong style={{ color: "#d97706" }}>★ {ag.stats?.avgRating || "4.9"}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* How the First-to-Accept Dispatch Works */}
      <div className="glass-panel" style={{ padding: "24px", backgroundColor: "#ffffff" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginBottom: "14px" }}>
          How OmniFlow BPO Parallel Broadcast Architecture Works
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
          <div style={{ padding: "16px", borderRadius: "10px", backgroundColor: "#f8fafc", border: "1px solid var(--border-color)" }}>
            <span style={{ fontSize: "11px", fontWeight: "800", color: "#2563eb", display: "block", marginBottom: "4px" }}>STEP 1</span>
            <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", marginBottom: "6px" }}>Customer Submits Inquiry</h4>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              User submits a query via the customer portal. The server registers the ticket in a waiting state.
            </p>
          </div>

          <div style={{ padding: "16px", borderRadius: "10px", backgroundColor: "#f8fafc", border: "1px solid var(--border-color)" }}>
            <span style={{ fontSize: "11px", fontWeight: "800", color: "#059669", display: "block", marginBottom: "4px" }}>STEP 2</span>
            <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", marginBottom: "6px" }}>Parallel Broadcast to Free Agents</h4>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              The server identifies all agents marked <strong>Available (Free)</strong> and pushes an immediate audio & visual alert to all of them.
            </p>
          </div>

          <div style={{ padding: "16px", borderRadius: "10px", backgroundColor: "#f8fafc", border: "1px solid var(--border-color)" }}>
            <span style={{ fontSize: "11px", fontWeight: "800", color: "#d97706", display: "block", marginBottom: "4px" }}>STEP 3</span>
            <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", marginBottom: "6px" }}>Atomic Claim (First to Accept)</h4>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              Whichever agent clicks "Accept" first acquires the lock. The notification automatically dismisses on all other agents' screens.
            </p>
          </div>

          <div style={{ padding: "16px", borderRadius: "10px", backgroundColor: "#f8fafc", border: "1px solid var(--border-color)" }}>
            <span style={{ fontSize: "11px", fontWeight: "800", color: "#7c3aed", display: "block", marginBottom: "4px" }}>STEP 4</span>
            <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", marginBottom: "6px" }}>Resolution & Auto-Return to Free</h4>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              Upon ending or resolving the chat, the agent's status instantly transitions back to <strong>Available</strong>, ready for the next request.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
