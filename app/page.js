"use client";

import React, { useState, useEffect } from "react";
import CustomerChat from "@/components/CustomerChat";
import { getSocket } from "@/lib/socket";

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
      setIsConnected(true);
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
      <header className="customer-page-header glass-nav" style={{ position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: "880px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(27, 59, 139, 0.12)",
              flexShrink: 0
            }}>
              <img src="/favicon-32x32.png" alt="OmniFlow Logo" style={{ width: "22px", height: "22px", objectFit: "contain" }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: "15px", fontWeight: "800", color: "var(--text-primary)", letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                OmniFlow Support
              </h1>
              <p style={{ fontSize: "11px", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Enterprise Real-Time Desk
              </p>
            </div>
          </div>

          {/* Online badge */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "11px",
            padding: "4px 10px",
            borderRadius: "20px",
            backgroundColor: "#ffffff",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-sm)",
            flexShrink: 0
          }}>
            <span className={`status-indicator ${isConnected ? "status-available" : "status-offline"}`} style={{ width: "8px", height: "8px" }} />
            <span style={{ color: isConnected ? "#059669" : "var(--text-muted)", fontWeight: "700" }}>
              {isConnected ? `${availableCount > 0 ? availableCount : "Agents"} Online` : "Connecting"}
            </span>
          </div>

        </div>
      </header>

      {/* MAIN CUSTOMER CHAT INTERFACE */}
      <main style={{ flex: 1, padding: "8px 0 24px 0" }}>
        <CustomerChat socket={socket} />
      </main>

      {/* DISCRETE FOOTER */}
      <footer style={{
        padding: "16px 20px",
        textAlign: "center",
        fontSize: "12px",
        color: "var(--text-muted)",
        borderTop: "1px solid var(--border-color)",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        maxWidth: "880px",
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box"
      }}>
        <span>© OmniFlow Support Services • Secure Live Messaging Desk</span>
      </footer>

    </div>
  );
}
