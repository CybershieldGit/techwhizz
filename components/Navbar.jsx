"use client";

import React from "react";
import { Headphones, MessageSquare, BarChart3, Split, ShieldCheck, Wifi } from "lucide-react";

export default function Navbar({ activeView, setActiveView, isConnected, metrics, currentAgent, onAgentSelect }) {
  return (
    <header className="glass-nav" style={{ position: "sticky", top: 0, zIndex: 50, padding: "12px 24px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        
        {/* Brand / Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)"
          }}>
            <Headphones size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h1 style={{ fontSize: "18px", fontWeight: "800", letterSpacing: "-0.02em", color: "#0f172a" }}>
                OmniFlow <span style={{ color: "#2563eb" }}>BPO</span>
              </h1>
              <span style={{
                fontSize: "10px",
                fontWeight: "700",
                textTransform: "uppercase",
                padding: "2px 7px",
                borderRadius: "6px",
                backgroundColor: "#eff6ff",
                color: "#1d4ed8",
                border: "1px solid #bfdbfe"
              }}>
                Live Dispatch
              </span>
            </div>
            <p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
              First-to-Claim BPO Support Router
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <nav style={{
          display: "flex",
          alignItems: "center",
          backgroundColor: "#f1f5f9",
          padding: "4px",
          borderRadius: "12px",
          border: "1px solid var(--border-color)",
          gap: "4px"
        }}>
          <button
            onClick={() => setActiveView("customer")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "8px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: activeView === "customer" ? "700" : "500",
              backgroundColor: activeView === "customer" ? "#ffffff" : "transparent",
              color: activeView === "customer" ? "var(--accent-blue)" : "var(--text-secondary)",
              boxShadow: activeView === "customer" ? "var(--shadow-sm)" : "none"
            }}
          >
            <MessageSquare size={16} />
            Customer Portal
          </button>

          <button
            onClick={() => setActiveView("agent")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "8px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: activeView === "agent" ? "700" : "500",
              backgroundColor: activeView === "agent" ? "#ffffff" : "transparent",
              color: activeView === "agent" ? "var(--accent-blue)" : "var(--text-secondary)",
              boxShadow: activeView === "agent" ? "var(--shadow-sm)" : "none"
            }}
          >
            <Headphones size={16} />
            Agent Workspace
            {metrics?.waitingChats > 0 && (
              <span style={{
                backgroundColor: "var(--accent-rose)",
                color: "#fff",
                fontSize: "10px",
                fontWeight: "700",
                padding: "1px 6px",
                borderRadius: "10px"
              }}>
                {metrics.waitingChats}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveView("supervisor")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "8px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: activeView === "supervisor" ? "700" : "500",
              backgroundColor: activeView === "supervisor" ? "#ffffff" : "transparent",
              color: activeView === "supervisor" ? "var(--accent-blue)" : "var(--text-secondary)",
              boxShadow: activeView === "supervisor" ? "var(--shadow-sm)" : "none"
            }}
          >
            <BarChart3 size={16} />
            BPO Supervisor
          </button>
        </nav>

        {/* Live System Indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            padding: "6px 12px",
            borderRadius: "8px",
            backgroundColor: "#ffffff",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-sm)"
          }}>
            <span className={`status-indicator ${isConnected ? "status-available" : "status-offline"}`} />
            <span style={{ color: isConnected ? "var(--text-primary)" : "var(--text-muted)", fontWeight: "600" }}>
              {isConnected ? "Engine Connected" : "Connecting..."}
            </span>
            <span style={{ color: "var(--text-muted)" }}>•</span>
            <span style={{ color: "#059669", fontWeight: "700" }}>
              {metrics?.availableAgents || 0} Free Agents
            </span>
          </div>
        </div>

      </div>
    </header>
  );
}
