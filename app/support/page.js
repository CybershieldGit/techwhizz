"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AgentWorkspace from "@/components/AgentWorkspace";
import { getSocket } from "@/lib/socket";
import { 
  Headphones, MessageSquare, ArrowLeft, 
  ShieldCheck, Users, Activity, Sparkles, Lock, ArrowRight, LogOut 
} from "lucide-react";

export default function SupportPortal() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [agentsList, setAgentsList] = useState([]);
  const [metrics, setMetrics] = useState({
    waitingChats: 0,
    activeChats: 0,
    resolvedChats: 0,
    totalAgents: 4,
    availableAgents: 0,
    busyAgents: 0
  });

  // Support Agent Authentication State
  const [agentSession, setAgentSession] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Check saved agent session on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("bpo_agent_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.role === "agent" || parsed.role === "admin")) {
          setAgentSession(parsed);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsAuthChecking(false);
    }
  }, []);

  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    setSocket(s);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    const onAgentsUpdate = (updatedAgents) => {
      setAgentsList(updatedAgents);
    };

    const onMetricsUpdate = (updatedMetrics) => {
      setMetrics(updatedMetrics);
    };

    const onSessionTerminated = ({ reason }) => {
      localStorage.removeItem("bpo_agent_session");
      setAgentSession(null);
      setLoginError(`Account Deactivated: Your employee session was terminated by administrator. Reason: ${reason || "Administrative action"}`);
    };

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("agents_update", onAgentsUpdate);
    s.on("metrics_update", onMetricsUpdate);
    s.on("agent_session_terminated", onSessionTerminated);

    if (s.connected) {
      setIsConnected(true);
    }

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("agents_update", onAgentsUpdate);
      s.off("metrics_update", onMetricsUpdate);
      s.off("agent_session_terminated", onSessionTerminated);
    };
  }, []);

  const handleAgentLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password,
          portal: "support"
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "Authentication failed.");
      } else {
        setAgentSession(data.user);
        localStorage.setItem("bpo_agent_session", JSON.stringify(data.user));
      }
    } catch (err) {
      setLoginError("Network connection error: " + err.message);
    } finally {
      setLoginLoading(false);
    }
  };


  const handleAgentLogout = () => {
    localStorage.removeItem("bpo_agent_session");
    setAgentSession(null);
  };

  if (isAuthChecking) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-primary)" }}>
        <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>Verifying support credentials...</span>
      </div>
    );
  }

  // ----------------------------------------------------
  // UN-AUTHENTICATED: AGENT SIGN IN SCREEN
  // ----------------------------------------------------
  if (!agentSession) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--bg-primary)" }}>
        
        {/* Simple top header */}
        <header className="glass-nav" style={{ padding: "14px 24px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #059669 0%, #10b981 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Headphones size={20} color="#ffffff" />
              </div>
              <h1 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>BPO Support Team Portal</h1>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <Link href="/" style={{ fontSize: "12px", color: "#2563eb", textDecoration: "none", fontWeight: "600" }}>User Portal (/)</Link>
              <span style={{ color: "#cbd5e1" }}>•</span>
              <Link href="/admin" style={{ fontSize: "12px", color: "#7c3aed", textDecoration: "none", fontWeight: "600" }}>Admin Portal (/admin)</Link>
            </div>
          </div>
        </header>

        {/* Login Card */}
        <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "460px", padding: "36px", backgroundColor: "#ffffff" }}>
            
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "14px", backgroundColor: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px auto", border: "1px solid #a7f3d0" }}>
                <Lock size={26} color="#059669" />
              </div>
              <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>Support Agent Sign In</h2>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
                Sign in with your authorized BPO representative credentials
              </p>
            </div>

            {loginError && (
              <div style={{ padding: "10px 14px", borderRadius: "8px", backgroundColor: "#fff1f2", border: "1px solid #fecdd3", color: "#e11d48", fontSize: "12px", marginBottom: "16px" }}>
                {loginError}
              </div>
            )}

            <form onSubmit={handleAgentLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  placeholder="agent@support.bpo"
                  style={{ width: "100%", padding: "11px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="Enter your password"
                  style={{ width: "100%", padding: "11px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: loginLoading ? "not-allowed" : "pointer",
                  marginTop: "8px",
                  boxShadow: "0 4px 14px rgba(5, 150, 105, 0.3)"
                }}
              >
                {loginLoading ? "Authenticating..." : "Sign In & Open Agent Desk"}
                <ArrowRight size={16} />
              </button>
            </form>

          </div>
        </main>
      </div>
    );
  }

  // ----------------------------------------------------
  // AUTHENTICATED: FULL AGENT DESK CONSOLE
  // ----------------------------------------------------
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--bg-primary)" }}>
      
      {/* SUPPORT TEAM DEDICATED LIGHT HEADER */}
      <header className="glass-nav support-portal-header">
        <div className="support-header-inner">
          
          {/* 1. Left: Brand & Title */}
          <div className="support-brand-section">
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)",
                flexShrink: 0
              }}>
                <Headphones size={18} color="#ffffff" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <h1 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
                    BPO Support
                  </h1>
                  <span style={{
                    fontSize: "10px",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    padding: "1px 6px",
                    borderRadius: "4px",
                    backgroundColor: "#ecfdf5",
                    color: "#059669",
                    border: "1px solid #a7f3d0"
                  }}>
                    LIVE
                  </span>
                </div>
                <p className="support-subtitle" style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                  First-to-Claim Queue Dispatch
                </p>
              </div>
            </div>

            {/* Mobile-Only Agent Quick Avatar & Logout */}
            <div className="mobile-agent-header-actions">
              <img
                src={agentSession.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50"}
                alt={agentSession.name}
                style={{ width: "26px", height: "26px", borderRadius: "50%", objectFit: "cover", border: "1px solid #cbd5e1" }}
              />
              <button
                onClick={handleAgentLogout}
                title="Sign Out"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "30px",
                  height: "30px",
                  borderRadius: "7px",
                  backgroundColor: "#fff1f2",
                  border: "1px solid #fecdd3",
                  color: "#e11d48",
                  cursor: "pointer"
                }}
              >
                <LogOut size={13} />
              </button>
            </div>
          </div>

          {/* 2. Center: Dedicated Console Title */}
          <div className="support-tabs-group" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "7px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "700",
                backgroundColor: "#ffffff",
                color: "var(--accent-blue)",
                boxShadow: "var(--shadow-sm)",
                border: "1px solid var(--border-color)"
              }}
            >
              <Headphones size={15} />
              <span>Agent Desk Console</span>
            </div>
          </div>

          {/* 3. Right: Desktop Agent Profile & Logout */}
          <div className="support-header-right">
            <div className="desktop-agent-session-badge">
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "5px 12px",
                borderRadius: "8px",
                backgroundColor: "#ffffff",
                border: "1px solid var(--border-color)",
                boxShadow: "var(--shadow-sm)"
              }}>
                <img
                  src={agentSession.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50"}
                  alt={agentSession.name}
                  style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }}
                />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#0f172a", lineHeight: 1.2 }}>
                    {agentSession.name}
                  </span>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                    {agentSession.role || "Support Agent"}
                  </span>
                </div>
              </div>

              <button
                onClick={handleAgentLogout}
                title="Sign Out of Session"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  backgroundColor: "#fff1f2",
                  border: "1px solid #fecdd3",
                  color: "#e11d48",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: "background-color 0.15s ease"
                }}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Main Support Area */}
      <main style={{ flex: 1, padding: "20px 0 40px 0" }}>
        <AgentWorkspace socket={socket} agentsList={agentsList} authenticatedAgent={agentSession} metrics={metrics} />
      </main>

      {/* Footer */}
      <footer style={{
        padding: "16px 24px",
        textAlign: "center",
        fontSize: "12px",
        color: "var(--text-muted)",
        borderTop: "1px solid var(--border-color)",
        backgroundColor: "rgba(255, 255, 255, 0.8)"
      }}>
        <span>BPO Support Portal • MongoDB Atlas Real-Time Synchronized</span>
      </footer>

    </div>
  );
}
