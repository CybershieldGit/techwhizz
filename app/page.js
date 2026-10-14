"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import CustomerChat from "@/components/CustomerChat";
import { getSocket } from "@/lib/socket";
import { Headphones, MessageSquare, Shield, Sparkles } from "lucide-react";

export default function CustomerHome() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [availableCount, setAvailableCount] = useState(0);

  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    setSocket(s);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    const onMetricsUpdate = (metrics) => {
      if (metrics) {
        setAvailableCount(metrics.availableAgents || 0);
      }
    };

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("metrics_update", onMetricsUpdate);

    if (s.connected) {
      setIsConnected(true);
    }

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("metrics_update", onMetricsUpdate);
    };
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--bg-primary)" }}>
      
      {/* CLEAN LIGHT THEME CUSTOMER HEADER */}
      <header className="glass-nav" style={{ position: "sticky", top: 0, zIndex: 50, padding: "14px 24px" }}>
        <div style={{ maxWidth: "880px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)"
            }}>
              <MessageSquare size={20} color="#ffffff" />
            </div>
            <div>
              <h1 style={{ fontSize: "16px", fontWeight: "800", color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                Live Customer Support
              </h1>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                Fast 1-on-1 Help & Inquiry Resolution
              </p>
            </div>
          </div>

          {/* Online badge */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            padding: "5px 12px",
            borderRadius: "20px",
            backgroundColor: "#ffffff",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-sm)"
          }}>
            <span className={`status-indicator ${isConnected ? "status-available" : "status-offline"}`} />
            <span style={{ color: isConnected ? "#059669" : "var(--text-muted)", fontWeight: "600" }}>
              {isConnected ? `${availableCount > 0 ? availableCount : "Agents"} Online` : "Connecting..."}
            </span>
          </div>

        </div>
      </header>

      {/* MAIN CUSTOMER CHAT INTERFACE */}
      <main style={{ flex: 1, padding: "24px 0 40px 0" }}>
        <CustomerChat socket={socket} />
      </main>

      {/* DISCRETE FOOTER */}
      <footer style={{
        padding: "16px 24px",
        textAlign: "center",
        fontSize: "12px",
        color: "var(--text-muted)",
        borderTop: "1px solid var(--border-color)",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
        maxWidth: "880px",
        margin: "0 auto",
        width: "100%"
      }}>
        <span>© Support Services • Secure Live Messaging</span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Link
            href="/support"
            style={{
              color: "var(--accent-blue)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "12px",
              fontWeight: "600",
              padding: "4px 10px",
              borderRadius: "6px",
              backgroundColor: "rgba(37, 99, 235, 0.08)",
              border: "1px solid rgba(37, 99, 235, 0.15)"
            }}
          >
            <Headphones size={13} />
            Support Desk (/support)
          </Link>
          <Link
            href="/admin"
            style={{
              color: "#7c3aed",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "12px",
              fontWeight: "600",
              padding: "4px 10px",
              borderRadius: "6px",
              backgroundColor: "#f5f3ff",
              border: "1px solid #ddd6fe"
            }}
          >
            <Shield size={13} />
            Admin Panel (/admin)
          </Link>
        </div>
      </footer>

    </div>
  );
}
