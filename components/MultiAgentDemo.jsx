"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Zap, BellRing, User, Send, CheckCircle2, 
  Clock, ShieldAlert, Sparkles, RefreshCw, MessageSquare
} from "lucide-react";
import { sound } from "@/lib/sound";

export default function MultiAgentDemo({ socket }) {
  // Scenario simulation state
  const [customerMsg, setCustomerMsg] = useState("Hello, our database credentials were reset and we need urgent API token reissue.");
  const [customerName, setCustomerName] = useState("Rachel Green");
  const [customerDept, setCustomerDept] = useState("Technical");

  // Chat request state
  const [demoChat, setDemoChat] = useState(null);
  const [demoStatus, setDemoStatus] = useState("idle"); // "idle" | "broadcasting" | "active" | "resolved"
  const [claimedAgentName, setClaimedAgentName] = useState(null);

  // Chat message stream in the active session
  const [messages, setMessages] = useState([]);
  const [custInput, setCustInput] = useState("");
  const [agentInput, setAgentInput] = useState("");

  // Agent 1 (Alex) and Agent 2 (Sarah) status
  const [agent1Status, setAgent1Status] = useState("available"); // "available" | "in_chat" | "busy"
  const [agent2Status, setAgent2Status] = useState("available"); // "available" | "in_chat" | "busy"

  // Flash alert state on each agent
  const [agent1Alert, setAgent1Alert] = useState(null);
  const [agent2Alert, setAgent2Alert] = useState(null);
  const [missedAlertNotice, setMissedAlertNotice] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Customer triggers live broadcast
  const handleInitiateBroadcast = () => {
    const chatId = `sim_${Date.now()}`;
    const initialRequest = {
      id: chatId,
      customerName,
      customerDept,
      initialMessage: customerMsg,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setDemoChat(initialRequest);
    setDemoStatus("broadcasting");
    setClaimedAgentName(null);
    setMissedAlertNotice(null);
    setMessages([
      {
        id: "msg_init",
        sender: "customer",
        senderName: customerName,
        text: customerMsg,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    // Send broadcast alert to whichever agents are "available" (free)
    sound.playIncomingAlert();

    if (agent1Status === "available") {
      setAgent1Alert(initialRequest);
    }
    if (agent2Status === "available") {
      setAgent2Alert(initialRequest);
    }
  };

  // Agent clicks "Accept Chat"
  const handleAgentAccept = (agentNumber, agentName) => {
    if (demoStatus !== "broadcasting") return;

    // RACE CONDITION WINNER: First to click wins!
    sound.playSuccessSound();
    setDemoStatus("active");
    setClaimedAgentName(agentName);

    // Add system message
    const joinMsg = {
      id: `msg_sys_${Date.now()}`,
      sender: "system",
      senderName: "BPO Dispatch",
      text: `${agentName} was first to accept and joined the session.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, joinMsg]);

    // Clear incoming broadcast alerts
    setAgent1Alert(null);
    setAgent2Alert(null);

    if (agentNumber === 1) {
      setAgent1Status("in_chat");
      // Other agent missed it!
      setMissedAlertNotice(`Agent 2 (Sarah) received lock rejection: "Chat already claimed by Alex Rivera."`);
    } else {
      setAgent2Status("in_chat");
      setMissedAlertNotice(`Agent 1 (Alex) received lock rejection: "Chat already claimed by Sarah Chen."`);
    }
  };

  // Customer sends message
  const handleSendFromCustomer = (e) => {
    e.preventDefault();
    if (!custInput.trim()) return;
    const newMsg = {
      id: `cust_${Date.now()}`,
      sender: "customer",
      senderName: customerName,
      text: custInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, newMsg]);
    setCustInput("");
    sound.playMessageSound();
  };

  // Agent sends message
  const handleSendFromAgent = (e) => {
    e.preventDefault();
    if (!agentInput.trim()) return;
    const newMsg = {
      id: `ag_${Date.now()}`,
      sender: "agent",
      senderName: claimedAgentName,
      text: agentInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, newMsg]);
    setAgentInput("");
    sound.playMessageSound();
  };

  // End / Resolve session and return agent to Free
  const handleResolveSession = () => {
    setDemoStatus("resolved");
    setAgent1Status("available");
    setAgent2Status("available");
    setAgent1Alert(null);
    setAgent2Alert(null);
    setMissedAlertNotice(null);
    const endMsg = {
      id: `msg_end_${Date.now()}`,
      sender: "system",
      senderName: "BPO Dispatch",
      text: `Chat session resolved. Agent ${claimedAgentName} is now marked Free (Available) again.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, endMsg]);
  };

  // Reset demo
  const handleReset = () => {
    setDemoChat(null);
    setDemoStatus("idle");
    setClaimedAgentName(null);
    setMessages([]);
    setAgent1Status("available");
    setAgent2Status("available");
    setAgent1Alert(null);
    setAgent2Alert(null);
    setMissedAlertNotice(null);
  };

  return (
    <div style={{ maxWidth: "1360px", margin: "24px auto", padding: "0 16px" }}>
      
      {/* Simulator Instructions Bar */}
      <div className="glass-panel" style={{ padding: "18px 24px", marginBottom: "20px", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              backgroundColor: "rgba(16, 185, 129, 0.2)",
              color: "#34d399",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Zap size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#ffffff" }}>
                Interactive BPO Broadcast & First-To-Accept Simulator
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                Experience how incoming customer requests broadcast simultaneously to all free agents, and how the first agent who clicks Accept locks the chat.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              padding: "7px 14px",
              borderRadius: "6px",
              backgroundColor: "rgba(31, 41, 55, 0.8)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-color)"
            }}
          >
            <RefreshCw size={14} />
            Reset Simulation
          </button>
        </div>
      </div>

      {/* Missed alert notification if someone lost the race */}
      {missedAlertNotice && (
        <div style={{
          padding: "12px 18px",
          borderRadius: "10px",
          backgroundColor: "rgba(245, 158, 11, 0.15)",
          border: "1px solid rgba(245, 158, 11, 0.3)",
          color: "#fbbf24",
          fontSize: "13px",
          fontWeight: "600",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <ShieldAlert size={16} />
          {missedAlertNotice}
        </div>
      )}

      {/* 3-COLUMN SPLIT SCREEN GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "18px" }}>
        
        {/* ================= COLUMN 1: CUSTOMER ================= */}
        <div className="glass-panel" style={{ padding: "18px", display: "flex", flexDirection: "column", height: "680px" }}>
          
          <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "12px", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: "#60a5fa" }}>
                COLUMN 1 • CUSTOMER
              </span>
              <span style={{
                fontSize: "11px",
                padding: "2px 8px",
                borderRadius: "10px",
                backgroundColor: demoStatus === "active" ? "rgba(16, 185, 129, 0.2)" : "rgba(59, 130, 246, 0.2)",
                color: demoStatus === "active" ? "#34d399" : "#93c5fd"
              }}>
                {demoStatus.toUpperCase()}
              </span>
            </div>
            <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#ffffff", marginTop: "4px" }}>
              {customerName}
            </h4>
          </div>

          {demoStatus === "idle" || demoStatus === "resolved" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1, justifyContent: "center" }}>
              <div>
                <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", backgroundColor: "var(--bg-input)", border: "1px solid var(--border-color)", color: "#fff", fontSize: "13px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                  Department
                </label>
                <select
                  value={customerDept}
                  onChange={(e) => setCustomerDept(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", backgroundColor: "var(--bg-input)", border: "1px solid var(--border-color)", color: "#fff", fontSize: "13px" }}
                >
                  <option value="Technical">Technical Support</option>
                  <option value="Billing">Billing Support</option>
                  <option value="General">General Inquiry</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                  Inquiry Query
                </label>
                <textarea
                  rows={3}
                  value={customerMsg}
                  onChange={(e) => setCustomerMsg(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", backgroundColor: "var(--bg-input)", border: "1px solid var(--border-color)", color: "#fff", fontSize: "13px" }}
                />
              </div>

              <button
                type="button"
                onClick={handleInitiateBroadcast}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: "700",
                  boxShadow: "var(--shadow-glow)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  marginTop: "8px"
                }}
              >
                <Zap size={16} />
                Click to Broadcast to All Free Agents!
              </button>
            </div>
          ) : demoStatus === "broadcasting" ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
              <div className="radar-anim" style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "rgba(59, 130, 246, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                <Zap size={28} color="#60a5fa" />
              </div>
              <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#ffffff", marginBottom: "6px" }}>
                Broadcasting Request...
              </h4>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", maxWidth: "260px" }}>
                Notice how both free agents on the right have received the broadcast alert! Click "Accept Chat" on either agent.
              </p>
            </div>
          ) : (
            /* ACTIVE CHAT STREAM (CUSTOMER SIDE) */
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", padding: "10px 0" }}>
                {messages.map((m) => {
                  const isMe = m.sender === "customer";
                  const isSys = m.sender === "system";
                  if (isSys) {
                    return (
                      <div key={m.id} style={{ textAlign: "center", fontSize: "11px", color: "var(--text-muted)", padding: "2px 8px" }}>
                        ⚡ {m.text}
                      </div>
                    );
                  }
                  return (
                    <div key={m.id} style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "85%" }}>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block" }}>{m.senderName}</span>
                      <div style={{
                        padding: "8px 12px",
                        borderRadius: isMe ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                        backgroundColor: isMe ? "var(--accent-blue)" : "var(--bg-input)",
                        color: "#fff",
                        fontSize: "12px"
                      }}>
                        {m.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendFromCustomer} style={{ display: "flex", gap: "6px", paddingTop: "8px", borderTop: "1px solid var(--border-color)" }}>
                <input
                  type="text"
                  value={custInput}
                  onChange={(e) => setCustInput(e.target.value)}
                  placeholder="Customer typing..."
                  style={{ flex: 1, padding: "8px 10px", borderRadius: "6px", backgroundColor: "var(--bg-input)", border: "1px solid var(--border-color)", color: "#fff", fontSize: "12px" }}
                />
                <button type="submit" style={{ padding: "8px 12px", borderRadius: "6px", backgroundColor: "var(--accent-blue)", color: "#fff" }}>
                  <Send size={14} />
                </button>
              </form>
            </div>
          )}

        </div>

        {/* ================= COLUMN 2: AGENT 1 (ALEX RIVERA) ================= */}
        <div className="glass-panel" style={{ padding: "18px", display: "flex", flexDirection: "column", height: "680px" }}>
          
          <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "12px", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: "#34d399" }}>
                COLUMN 2 • AGENT 1
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className={`status-indicator status-${agent1Status}`} />
                <span style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "capitalize" }}>
                  {agent1Status === "available" ? "Free" : agent1Status === "in_chat" ? "In Chat" : "Busy"}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
              <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#ffffff" }}>
                Alex Rivera
              </h4>
              <button
                type="button"
                onClick={() => setAgent1Status(agent1Status === "available" ? "busy" : "available")}
                style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", backgroundColor: "var(--bg-input)", color: "var(--text-secondary)" }}
              >
                Toggle {agent1Status === "available" ? "Away" : "Free"}
              </button>
            </div>
          </div>

          {/* INCOMING BROADCAST POPUP ON AGENT 1 */}
          {agent1Alert && demoStatus === "broadcasting" && (
            <div className="broadcast-flash" style={{ padding: "14px", borderRadius: "10px", backgroundColor: "rgba(16, 185, 129, 0.15)", border: "2px solid #10b981", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <BellRing size={16} color="#10b981" />
                <span style={{ fontSize: "11px", fontWeight: "800", color: "#34d399", textTransform: "uppercase" }}>
                  Incoming Chat Alert!
                </span>
              </div>
              <p style={{ fontSize: "12px", color: "#ffffff", fontWeight: "600" }}>
                {agent1Alert.customerName} ({agent1Alert.customerDept})
              </p>
              <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: "4px 0 10px 0" }}>
                "{agent1Alert.initialMessage}"
              </p>
              <button
                type="button"
                onClick={() => handleAgentAccept(1, "Alex Rivera")}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: "800",
                  boxShadow: "var(--shadow-glow-emerald)"
                }}
              >
                ⚡ ACCEPT CHAT (CLAIM)
              </button>
            </div>
          )}

          {/* IF AGENT 1 WON THE CHAT */}
          {demoStatus === "active" && claimedAgentName === "Alex Rivera" ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", color: "#34d399", fontWeight: "700" }}>✓ Active with {customerName}</span>
                <button
                  onClick={handleResolveSession}
                  style={{ fontSize: "10px", padding: "4px 8px", borderRadius: "4px", backgroundColor: "rgba(16, 185, 129, 0.2)", color: "#34d399", border: "1px solid #10b981" }}
                >
                  Resolve & Free
                </button>
              </div>

              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", padding: "6px 0" }}>
                {messages.map((m) => {
                  const isMe = m.sender === "agent";
                  const isSys = m.sender === "system";
                  if (isSys) {
                    return <div key={m.id} style={{ textAlign: "center", fontSize: "10px", color: "var(--text-muted)" }}>⚡ {m.text}</div>;
                  }
                  return (
                    <div key={m.id} style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "85%" }}>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block" }}>{m.senderName}</span>
                      <div style={{
                        padding: "8px 12px",
                        borderRadius: isMe ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                        backgroundColor: isMe ? "var(--accent-emerald)" : "var(--bg-input)",
                        color: "#fff",
                        fontSize: "12px"
                      }}>
                        {m.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleSendFromAgent} style={{ display: "flex", gap: "6px", paddingTop: "8px", borderTop: "1px solid var(--border-color)" }}>
                <input
                  type="text"
                  value={agentInput}
                  onChange={(e) => setAgentInput(e.target.value)}
                  placeholder="Alex typing reply..."
                  style={{ flex: 1, padding: "8px 10px", borderRadius: "6px", backgroundColor: "var(--bg-input)", border: "1px solid var(--border-color)", color: "#fff", fontSize: "12px" }}
                />
                <button type="submit" style={{ padding: "8px 12px", borderRadius: "6px", backgroundColor: "var(--accent-emerald)", color: "#fff" }}>
                  <Send size={14} />
                </button>
              </form>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
              {claimedAgentName === "Sarah Chen" ? (
                <div>
                  <span style={{ color: "#fbbf24", display: "block", marginBottom: "4px", fontWeight: "700" }}>⚠️ Chat Claimed by Sarah Chen</span>
                  <span>Alex remains Free (Available) for the next incoming inquiry.</span>
                </div>
              ) : (
                <span>Agent standing by. Status: <strong>{agent1Status}</strong></span>
              )}
            </div>
          )}

        </div>

        {/* ================= COLUMN 3: AGENT 2 (SARAH CHEN) ================= */}
        <div className="glass-panel" style={{ padding: "18px", display: "flex", flexDirection: "column", height: "680px" }}>
          
          <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "12px", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: "#c084fc" }}>
                COLUMN 3 • AGENT 2
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className={`status-indicator status-${agent2Status}`} />
                <span style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "capitalize" }}>
                  {agent2Status === "available" ? "Free" : agent2Status === "in_chat" ? "In Chat" : "Busy"}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
              <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#ffffff" }}>
                Sarah Chen
              </h4>
              <button
                type="button"
                onClick={() => setAgent2Status(agent2Status === "available" ? "busy" : "available")}
                style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", backgroundColor: "var(--bg-input)", color: "var(--text-secondary)" }}
              >
                Toggle {agent2Status === "available" ? "Away" : "Free"}
              </button>
            </div>
          </div>

          {/* INCOMING BROADCAST POPUP ON AGENT 2 */}
          {agent2Alert && demoStatus === "broadcasting" && (
            <div className="broadcast-flash" style={{ padding: "14px", borderRadius: "10px", backgroundColor: "rgba(16, 185, 129, 0.15)", border: "2px solid #10b981", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <BellRing size={16} color="#10b981" />
                <span style={{ fontSize: "11px", fontWeight: "800", color: "#34d399", textTransform: "uppercase" }}>
                  Incoming Chat Alert!
                </span>
              </div>
              <p style={{ fontSize: "12px", color: "#ffffff", fontWeight: "600" }}>
                {agent2Alert.customerName} ({agent2Alert.customerDept})
              </p>
              <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: "4px 0 10px 0" }}>
                "{agent2Alert.initialMessage}"
              </p>
              <button
                type="button"
                onClick={() => handleAgentAccept(2, "Sarah Chen")}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: "800",
                  boxShadow: "var(--shadow-glow-emerald)"
                }}
              >
                ⚡ ACCEPT CHAT (CLAIM)
              </button>
            </div>
          )}

          {/* IF AGENT 2 WON THE CHAT */}
          {demoStatus === "active" && claimedAgentName === "Sarah Chen" ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", color: "#34d399", fontWeight: "700" }}>✓ Active with {customerName}</span>
                <button
                  onClick={handleResolveSession}
                  style={{ fontSize: "10px", padding: "4px 8px", borderRadius: "4px", backgroundColor: "rgba(16, 185, 129, 0.2)", color: "#34d399", border: "1px solid #10b981" }}
                >
                  Resolve & Free
                </button>
              </div>

              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", padding: "6px 0" }}>
                {messages.map((m) => {
                  const isMe = m.sender === "agent";
                  const isSys = m.sender === "system";
                  if (isSys) {
                    return <div key={m.id} style={{ textAlign: "center", fontSize: "10px", color: "var(--text-muted)" }}>⚡ {m.text}</div>;
                  }
                  return (
                    <div key={m.id} style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "85%" }}>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block" }}>{m.senderName}</span>
                      <div style={{
                        padding: "8px 12px",
                        borderRadius: isMe ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                        backgroundColor: isMe ? "var(--accent-purple)" : "var(--bg-input)",
                        color: "#fff",
                        fontSize: "12px"
                      }}>
                        {m.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleSendFromAgent} style={{ display: "flex", gap: "6px", paddingTop: "8px", borderTop: "1px solid var(--border-color)" }}>
                <input
                  type="text"
                  value={agentInput}
                  onChange={(e) => setAgentInput(e.target.value)}
                  placeholder="Sarah typing reply..."
                  style={{ flex: 1, padding: "8px 10px", borderRadius: "6px", backgroundColor: "var(--bg-input)", border: "1px solid var(--border-color)", color: "#fff", fontSize: "12px" }}
                />
                <button type="submit" style={{ padding: "8px 12px", borderRadius: "6px", backgroundColor: "var(--accent-purple)", color: "#fff" }}>
                  <Send size={14} />
                </button>
              </form>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
              {claimedAgentName === "Alex Rivera" ? (
                <div>
                  <span style={{ color: "#fbbf24", display: "block", marginBottom: "4px", fontWeight: "700" }}>⚠️ Chat Claimed by Alex Rivera</span>
                  <span>Sarah remains Free (Available) for the next incoming inquiry.</span>
                </div>
              ) : (
                <span>Agent standing by. Status: <strong>{agent2Status}</strong></span>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
