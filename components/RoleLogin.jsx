"use client";

import React, { useState } from "react";
import { Headphones, User, ShieldCheck, Lock, ArrowRight, Sparkles, Check } from "lucide-react";

export default function RoleLogin({ onLoginSuccess, agentsList }) {
  const [activeTab, setActiveTab] = useState("agent");

  // Agent form
  const [agentEmail, setAgentEmail] = useState("alex@support.bpo");
  const [agentPassword, setAgentPassword] = useState("bpo123");
  const [agentError, setAgentError] = useState("");

  // Customer form
  const [customerName, setCustomerName] = useState("Jordan Hayes");
  const [customerEmail, setCustomerEmail] = useState("jordan@enterprise.com");
  const [customerDept, setCustomerDept] = useState("Technical");

  const handleAgentLogin = (e) => {
    e.preventDefault();
    setAgentError("");

    const found = agentsList?.find((a) => a.email.toLowerCase() === agentEmail.toLowerCase());
    if (found && agentPassword === "bpo123") {
      onLoginSuccess({
        role: "agent",
        agentId: found.id,
        user: found
      });
    } else {
      setAgentError("Invalid agent credentials. Use any listed email with password: bpo123");
    }
  };

  const handleQuickAgentSelect = (agent) => {
    setAgentEmail(agent.email);
    setAgentPassword("bpo123");
    onLoginSuccess({
      role: "agent",
      agentId: agent.id,
      user: agent
    });
  };

  const handleCustomerLogin = (e) => {
    e.preventDefault();
    if (!customerName || !customerEmail) return;

    onLoginSuccess({
      role: "customer",
      user: {
        name: customerName,
        email: customerEmail,
        department: customerDept
      }
    });
  };

  return (
    <div style={{ maxWidth: "540px", margin: "40px auto", padding: "0 16px" }}>
      <div className="glass-panel" style={{ padding: "36px", backgroundColor: "#ffffff", boxShadow: "var(--shadow-lg)" }}>
        
        {/* Brand header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            width: "52px",
            height: "52px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 14px auto",
            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)"
          }}>
            <Headphones size={26} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.02em" }}>
            OmniFlow BPO Portal
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
            Sign in as an Authorized Support Agent or End-User Customer
          </p>
        </div>

        {/* Tab switch */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          backgroundColor: "#f1f5f9",
          padding: "4px",
          borderRadius: "10px",
          gap: "4px",
          marginBottom: "24px",
          border: "1px solid var(--border-color)"
        }}>
          <button
            type="button"
            onClick={() => setActiveTab("agent")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: activeTab === "agent" ? "700" : "500",
              backgroundColor: activeTab === "agent" ? "#ffffff" : "transparent",
              color: activeTab === "agent" ? "var(--accent-blue)" : "var(--text-secondary)",
              boxShadow: activeTab === "agent" ? "var(--shadow-sm)" : "none"
            }}
          >
            <ShieldCheck size={16} />
            Support Agent
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("customer")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: activeTab === "customer" ? "700" : "500",
              backgroundColor: activeTab === "customer" ? "#ffffff" : "transparent",
              color: activeTab === "customer" ? "var(--accent-blue)" : "var(--text-secondary)",
              boxShadow: activeTab === "customer" ? "var(--shadow-sm)" : "none"
            }}
          >
            <User size={16} />
            Customer
          </button>
        </div>

        {/* AGENT LOGIN FORM */}
        {activeTab === "agent" && (
          <div>
            <form onSubmit={handleAgentLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {agentError && (
                <div style={{ padding: "10px 14px", borderRadius: "8px", backgroundColor: "#fff1f2", border: "1px solid #fecdd3", color: "#e11d48", fontSize: "12px" }}>
                  {agentError}
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Agent Work Email
                </label>
                <input
                  type="email"
                  required
                  value={agentEmail}
                  onChange={(e) => setAgentEmail(e.target.value)}
                  placeholder="agent@support.bpo"
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: "8px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    color: "#0f172a",
                    fontSize: "14px"
                  }}
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#334155" }}>
                    Password
                  </label>
                  <span style={{ fontSize: "11px", color: "var(--accent-blue)", fontWeight: "600" }}>Default: bpo123</span>
                </div>
                <input
                  type="password"
                  required
                  value={agentPassword}
                  onChange={(e) => setAgentPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: "8px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    color: "#0f172a",
                    fontSize: "14px"
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: "700",
                  marginTop: "8px",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)"
                }}
              >
                Sign In as Agent & Open Console
                <ArrowRight size={16} />
              </button>
            </form>

            <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--border-color)" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "10px" }}>
                1-Click Agent Selection
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {agentsList?.map((ag) => (
                  <button
                    key={ag.id}
                    type="button"
                    onClick={() => handleQuickAgentSelect(ag)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      textAlign: "left"
                    }}
                  >
                    <img src={ag.avatar} alt={ag.name} style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }} />
                    <div style={{ overflow: "hidden" }}>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: "#0f172a", display: "block", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ag.name}</span>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block" }}>{ag.department}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CUSTOMER LOGIN FORM */}
        {activeTab === "customer" && (
          <form onSubmit={handleCustomerLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                Your Name
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Jordan Hayes"
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "8px",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  color: "#0f172a",
                  fontSize: "14px"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                Email Address
              </label>
              <input
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="jordan@company.com"
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "8px",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  color: "#0f172a",
                  fontSize: "14px"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                Inquiry Category
              </label>
              <select
                value={customerDept}
                onChange={(e) => setCustomerDept(e.target.value)}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "8px",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  color: "#0f172a",
                  fontSize: "14px",
                  cursor: "pointer"
                }}
              >
                <option value="Technical">Technical Support</option>
                <option value="Billing">Billing & Subscription</option>
                <option value="General">General Inquiry</option>
                <option value="Escalation">Priority Escalation</option>
              </select>
            </div>

            <button
              type="submit"
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
                marginTop: "8px",
                boxShadow: "0 4px 12px rgba(5, 150, 105, 0.3)"
              }}
            >
              Continue to Customer Chat Hub
              <ArrowRight size={16} />
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
