"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Headphones, Send, User, CheckCircle2, Clock, 
  MessageSquare, AlertTriangle, Shield, Check, Flame, 
  FileText, Zap, ChevronRight, LogIn, BellRing, Sparkles,
  ChevronDown, Bell, Volume2, VolumeX
} from "lucide-react";
import { sound } from "@/lib/sound";

export default function AgentWorkspace({ socket, agentsList, authenticatedAgent }) {
  const [selectedAgentId, setSelectedAgentId] = useState(authenticatedAgent?.id || "agent_1");
  const [currentAgent, setCurrentAgent] = useState(authenticatedAgent || null);

  useEffect(() => {
    if (authenticatedAgent?.id) {
      setSelectedAgentId(authenticatedAgent.id);
      setCurrentAgent(authenticatedAgent);
    }
  }, [authenticatedAgent]);

  const [incomingBroadcasts, setIncomingBroadcasts] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isCustomerTyping, setIsCustomerTyping] = useState(false);
  const [toastNotification, setToastNotification] = useState(null);

  // Desktop Push Notifications & Audio state
  const [notificationPermission, setNotificationPermission] = useState("default");
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // Live real-time timer ticker (updates every second for elapsed queue waiting time)
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatElapsed = (createdAt) => {
    if (!createdAt) return "Just now";
    const diffSec = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 1000));
    if (diffSec < 60) return `${diffSec}s ago`;
    const mins = Math.floor(diffSec / 60);
    const remSec = diffSec % 60;
    if (mins < 60) return `${mins}m ${remSec}s ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m ago`;
  };

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleRequestPushNotifications = async () => {
    const perm = await sound.requestNotificationPermission();
    setNotificationPermission(perm);
    if (!isAudioMuted) {
      sound.playIncomingAlert();
    }
    if (perm === "granted") {
      sound.sendPushNotification("🔔 Support Push Alerts Activated!", {
        body: "You will now receive instant desktop push notifications and sound alerts when incoming customer inquiries arrive.",
        requireInteraction: false
      });
      setToastNotification({
        type: "success",
        message: "Push notifications and sound alerts enabled successfully!"
      });
    } else if (perm === "denied") {
      setToastNotification({
        type: "warning",
        message: "Notifications are blocked. Please enable them in your browser permissions."
      });
    }
    setTimeout(() => setToastNotification(null), 5000);
  };

  // Agent notes
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");

  // Resolution modal state
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionSummary, setResolutionSummary] = useState("");

  const [isAgentDropdownOpen, setIsAgentDropdownOpen] = useState(false);
  const agentDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (agentDropdownRef.current && !agentDropdownRef.current.contains(event.target)) {
        setIsAgentDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isCustomerTyping]);

  // Continuous sound alert ring loop while there are unclaimed incoming broadcasts
  useEffect(() => {
    const shouldRing = incomingBroadcasts.length > 0 && !activeChat && !isAudioMuted && (!currentAgent || currentAgent.status === "available");
    if (shouldRing) {
      sound.startRingingAlert(1800);
    } else {
      sound.stopRingingAlert();
    }

    return () => {
      sound.stopRingingAlert();
    };
  }, [incomingBroadcasts.length, activeChat, isAudioMuted, currentAgent?.status]);

  useEffect(() => {
    if (agentsList && agentsList.length > 0) {
      const found = agentsList.find((a) => a.id === selectedAgentId);
      if (found) {
        setCurrentAgent(found);
      }
    }
  }, [agentsList, selectedAgentId]);

  useEffect(() => {
    if (!socket || !selectedAgentId) return;

    socket.emit("agent_register", {
      agentId: selectedAgentId,
      status: "available"
    });

    const handleAgentRegistered = ({ agent }) => {
      setCurrentAgent(agent);
    };

    const handleIncomingBroadcast = (chat) => {
      setIncomingBroadcasts((prev) => {
        if (prev.some((c) => c.id === chat.id)) return prev;
        return [chat, ...prev];
      });

      // Start continuous ringing alert if audio is not muted and agent is available
      if (!isAudioMuted && (!currentAgent || currentAgent.status === "available")) {
        sound.startRingingAlert(1800);
      }

      // Trigger Desktop Push Notification with Sound
      const phoneSnippet = chat.customer?.phone ? `📞 ${chat.customer.phone} • ` : "";
      sound.sendPushNotification(`🚨 New Chat Request: ${chat.customer?.name || "Customer"}`, {
        body: `${phoneSnippet}${chat.subject || "Support Inquiry"}\n"${chat.initialMessage || ""}"`,
        tag: `incoming_broadcast_${chat.id}`,
        requireInteraction: true,
        onClick: () => {
          try {
            window.focus();
          } catch {}
        }
      });

      setToastNotification({
        type: "warning",
        message: `🚨 Incoming Broadcast: ${chat.customer?.name} (${chat.customer?.phone || "No phone"}) - "${chat.subject}"`
      });
      setTimeout(() => setToastNotification(null), 5000);
    };

    const handleChatClaimedByOther = ({ chatId, claimedBy, claimedById }) => {
      setIncomingBroadcasts((prev) => {
        const remaining = prev.filter((c) => c.id !== chatId);
        if (remaining.length === 0) {
          sound.stopRingingAlert();
        }
        return remaining;
      });

      if (claimedById !== selectedAgentId) {
        setToastNotification({
          type: "warning",
          message: `Notice: Chat #${chatId.substring(5, 11)} was accepted by ${claimedBy}.`
        });
        setTimeout(() => setToastNotification(null), 4000);
      }
    };

    const handleChatAcceptSuccess = ({ chat }) => {
      sound.stopRingingAlert();
      setActiveChat(chat);
      setMessages(chat.messages || []);
      setNotes(chat.notes || []);
      setIncomingBroadcasts((prev) => {
        const remaining = prev.filter((c) => c.id !== chat.id);
        if (remaining.length === 0) {
          sound.stopRingingAlert();
        }
        return remaining;
      });
      sound.playSuccessSound();
      setToastNotification({
        type: "success",
        message: `Chat claimed successfully! You are now connected with ${chat.customer.name}.`
      });
      setTimeout(() => setToastNotification(null), 4000);
    };

    const handleChatAcceptFailed = ({ reason }) => {
      sound.stopRingingAlert();
      sound.playClaimedAlert();
      setToastNotification({
        type: "error",
        message: reason || "Chat was already accepted by another agent."
      });
      setTimeout(() => setToastNotification(null), 5000);
    };

    const handleNewMessage = ({ chatId, message }) => {
      if (activeChat && activeChat.id === chatId) {
        setMessages((prev) => [...prev, message]);
        if (message.sender === "customer") {
          if (!isAudioMuted) {
            sound.playMessageSound();
          }

          // Trigger Desktop Push Notification if window/tab is in the background
          if (typeof document !== "undefined" && document.hidden) {
            sound.sendPushNotification(`💬 ${activeChat?.customer?.name || "Customer"} says:`, {
              body: message.text || "New message received",
              tag: `msg_${chatId}`,
              requireInteraction: false,
              onClick: () => {
                try {
                  window.focus();
                } catch {}
              }
            });
          }
        }
      }
    };

    const handleUserTyping = ({ sender, isTyping }) => {
      if (sender === "customer") {
        setIsCustomerTyping(isTyping);
      }
    };

    const handleChatEnded = ({ chat }) => {
      if (activeChat && activeChat.id === chat.id) {
        setActiveChat(null);
        setMessages([]);
        setNotes([]);
        setShowResolveModal(false);
        setToastNotification({
          type: "info",
          message: `Chat with ${chat.customer.name} closed. You are now Available (Free) for incoming chats.`
        });
        setTimeout(() => setToastNotification(null), 5000);
      }
    };

    const handleNotesUpdated = ({ chatId, notes }) => {
      if (activeChat && activeChat.id === chatId) {
        setNotes(notes);
      }
    };

    const handleCustomerPresenceUpdate = ({ chatId, customerConnected, disconnectedAt }) => {
      setIncomingBroadcasts((prev) =>
        prev.map((c) =>
          c.id === chatId ? { ...c, customerConnected, customerDisconnectedAt: disconnectedAt } : c
        )
      );
      if (activeChat && activeChat.id === chatId) {
        setActiveChat((prev) => ({ ...prev, customerConnected, customerDisconnectedAt: disconnectedAt }));
      }
    };

    socket.on("agent_registered", handleAgentRegistered);
    socket.on("incoming_chat_broadcast", handleIncomingBroadcast);
    socket.on("chat_claimed_by_other", handleChatClaimedByOther);
    socket.on("chat_accept_success", handleChatAcceptSuccess);
    socket.on("chat_accept_failed", handleChatAcceptFailed);
    socket.on("new_message", handleNewMessage);
    socket.on("user_typing", handleUserTyping);
    socket.on("chat_ended", handleChatEnded);
    socket.on("chat_notes_updated", handleNotesUpdated);
    socket.on("customer_presence_update", handleCustomerPresenceUpdate);

    return () => {
      socket.off("agent_registered", handleAgentRegistered);
      socket.off("incoming_chat_broadcast", handleIncomingBroadcast);
      socket.off("chat_claimed_by_other", handleChatClaimedByOther);
      socket.off("chat_accept_success", handleChatAcceptSuccess);
      socket.off("chat_accept_failed", handleChatAcceptFailed);
      socket.off("new_message", handleNewMessage);
      socket.off("user_typing", handleUserTyping);
      socket.off("chat_ended", handleChatEnded);
      socket.off("chat_notes_updated", handleNotesUpdated);
      socket.off("customer_presence_update", handleCustomerPresenceUpdate);
    };
  }, [socket, selectedAgentId, activeChat]);

  const handleStatusChange = (newStatus) => {
    if (activeChat) {
      alert("You cannot change status while engaged in an active chat.");
      return;
    }
    if (newStatus !== "available") {
      sound.stopRingingAlert();
    }
    if (socket) {
      socket.emit("agent_update_status", {
        agentId: selectedAgentId,
        status: newStatus
      });
    }
  };

  const handleAcceptChat = (chatId) => {
    if (!socket || !selectedAgentId) return;

    socket.emit("agent_accept_chat", {
      agentId: selectedAgentId,
      chatId: chatId
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket || !activeChat || !currentAgent) return;

    socket.emit("send_message", {
      chatId: activeChat.id,
      sender: "agent",
      senderName: currentAgent.name,
      text: inputMessage.trim()
    });

    socket.emit("typing", {
      chatId: activeChat.id,
      sender: "agent",
      isTyping: false
    });

    setInputMessage("");
  };

  const insertCannedResponse = (text) => {
    if (!socket || !activeChat || !currentAgent) return;
    socket.emit("send_message", {
      chatId: activeChat.id,
      sender: "agent",
      senderName: currentAgent.name,
      text: text
    });
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);

    if (socket && activeChat) {
      socket.emit("typing", {
        chatId: activeChat.id,
        sender: "agent",
        isTyping: true
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing", {
          chatId: activeChat.id,
          sender: "agent",
          isTyping: false
        });
      }, 1500);
    }
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNote.trim() || !socket || !activeChat || !currentAgent) return;
    socket.emit("add_agent_note", {
      chatId: activeChat.id,
      agentName: currentAgent.name,
      note: newNote.trim()
    });
    setNewNote("");
  };

  const handleConfirmResolve = () => {
    if (!socket || !activeChat || !currentAgent) return;
    socket.emit("end_chat", {
      chatId: activeChat.id,
      resolvedBy: currentAgent.name,
      summary: resolutionSummary || "Issue solved successfully."
    });
    setShowResolveModal(false);
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "16px auto", padding: "0 16px" }}>
      
      {/* Toast Notification */}
      {toastNotification && (
        <div style={{
          position: "fixed",
          top: "80px",
          right: "24px",
          zIndex: 100,
          padding: "12px 20px",
          borderRadius: "10px",
          backgroundColor: toastNotification.type === "success" ? "#065f46" : toastNotification.type === "warning" ? "#92400e" : "#b91c1c",
          color: "#ffffff",
          fontSize: "13px",
          fontWeight: "600",
          boxShadow: "var(--shadow-lg)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          border: "1px solid rgba(255,255,255,0.2)"
        }}>
          {toastNotification.type === "success" && <Check size={16} />}
          {toastNotification.type === "warning" && <AlertTriangle size={16} />}
          {toastNotification.message}
        </div>
      )}

      {/* AGENT ROSTER / QUICK SWITCHER BAR */}
      <div className="glass-panel" style={{ padding: "16px 20px", marginBottom: "20px", backgroundColor: "#ffffff" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          
          <div>
            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
              Active Support Agent Identity
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "6px" }}>
              <div style={{ position: "relative" }} ref={agentDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsAgentDropdownOpen(!isAgentDropdownOpen)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    backgroundColor: "#ffffff",
                    border: isAgentDropdownOpen ? "1px solid #2563eb" : "1px solid #cbd5e1",
                    color: "#0f172a",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    boxShadow: isAgentDropdownOpen ? "0 0 0 3px rgba(37, 99, 235, 0.12)" : "var(--shadow-sm)"
                  }}
                >
                  <img
                    src={currentAgent?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50"}
                    alt={currentAgent?.name}
                    style={{ width: "22px", height: "22px", borderRadius: "50%", objectFit: "cover" }}
                  />
                  <span>
                    {currentAgent?.name} ({currentAgent?.role} • {currentAgent?.department})
                  </span>
                  <ChevronDown
                    size={16}
                    color="#64748b"
                    style={{
                      transform: isAgentDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease"
                    }}
                  />
                </button>

                {isAgentDropdownOpen && (
                  <div style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    left: 0,
                    minWidth: "320px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
                    zIndex: 100,
                    overflow: "hidden",
                    padding: "4px"
                  }}>
                    {agentsList?.map((ag) => {
                      const isSelected = selectedAgentId === ag.id;
                      return (
                        <button
                          key={ag.id}
                          type="button"
                          onClick={() => {
                            setSelectedAgentId(ag.id);
                            setIsAgentDropdownOpen(false);
                          }}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "9px 12px",
                            borderRadius: "6px",
                            backgroundColor: isSelected ? "#eff6ff" : "transparent",
                            color: isSelected ? "#1d4ed8" : "#0f172a",
                            textAlign: "left",
                            fontSize: "13px",
                            cursor: "pointer",
                            border: "none",
                            fontWeight: isSelected ? "700" : "500"
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = "#f8fafc";
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          <img
                            src={ag.avatar}
                            alt={ag.name}
                            style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ fontWeight: "700" }}>{ag.name}</span>
                              <span className={`status-indicator status-${ag.status}`} />
                            </div>
                            <span style={{ fontSize: "11px", color: isSelected ? "#3b82f6" : "#64748b", display: "block" }}>
                              {ag.role} • {ag.department}
                            </span>
                          </div>
                          {isSelected && <Check size={16} color="#2563eb" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 12px", borderRadius: "8px", backgroundColor: "#f8fafc", border: "1px solid var(--border-color)" }}>
                <span className={`status-indicator status-${currentAgent?.status || "offline"}`} />
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  Status: <strong style={{ color: currentAgent?.status === "available" ? "#059669" : currentAgent?.status === "in_chat" ? "#2563eb" : "#d97706" }}>
                    {currentAgent?.status === "available" ? "Free (Ready for Chats)" : currentAgent?.status === "in_chat" ? "In Active Chat" : currentAgent?.status || "Offline"}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Status & Push Alert Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            
            {/* Desktop Push Notification Permission Button / Badge */}
            {notificationPermission !== "granted" ? (
              <button
                type="button"
                id="enable-push-notifications-btn"
                onClick={handleRequestPushNotifications}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  fontSize: "12px",
                  fontWeight: "700",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
                  transition: "background-color 0.15s ease"
                }}
              >
                <BellRing size={15} />
                <span>Enable Push & Sound Alerts</span>
              </button>
            ) : (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 12px",
                borderRadius: "8px",
                backgroundColor: "#ecfdf5",
                border: "1px solid #a7f3d0"
              }}>
                <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: "700", color: "#059669" }}>
                  <Bell size={14} color="#059669" />
                  Push Alerts Active
                </span>
                <button
                  type="button"
                  id="test-sound-btn"
                  onClick={() => sound.playIncomingAlert()}
                  title="Test Sound Alert"
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #cbd5e1",
                    color: "#334155",
                    cursor: "pointer"
                  }}
                >
                  🔊 Test
                </button>
              </div>
            )}

            {/* Sound Mute Toggle */}
            <button
              type="button"
              id="toggle-audio-mute-btn"
              onClick={() => {
                const nextMuted = !isAudioMuted;
                setIsAudioMuted(nextMuted);
                if (nextMuted) {
                  sound.stopRingingAlert();
                }
              }}
              title={isAudioMuted ? "Unmute Sound" : "Mute Sound"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                fontWeight: "600",
                padding: "8px 12px",
                borderRadius: "8px",
                backgroundColor: isAudioMuted ? "#fef2f2" : "#ffffff",
                color: isAudioMuted ? "#ef4444" : "#475569",
                border: isAudioMuted ? "1px solid #fecaca" : "1px solid #cbd5e1",
                cursor: "pointer"
              }}
            >
              {isAudioMuted ? <VolumeX size={15} color="#ef4444" /> : <Volume2 size={15} color="#475569" />}
              <span>{isAudioMuted ? "Muted" : "Sound ON"}</span>
            </button>

            <div style={{ width: "1px", height: "24px", backgroundColor: "#e2e8f0", margin: "0 2px" }} />

            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Availability:</span>
            <button
              onClick={() => handleStatusChange("available")}
              disabled={activeChat !== null}
              style={{
                fontSize: "12px",
                fontWeight: "700",
                padding: "8px 14px",
                borderRadius: "8px",
                backgroundColor: currentAgent?.status === "available" ? "#ecfdf5" : "#ffffff",
                color: currentAgent?.status === "available" ? "#059669" : "var(--text-secondary)",
                border: currentAgent?.status === "available" ? "1px solid #10b981" : "1px solid #cbd5e1",
                boxShadow: "var(--shadow-sm)",
                opacity: activeChat !== null ? 0.5 : 1,
                cursor: activeChat !== null ? "not-allowed" : "pointer"
              }}
            >
              🟢 Free (Available)
            </button>
            <button
              onClick={() => handleStatusChange("busy")}
              disabled={activeChat !== null}
              style={{
                fontSize: "12px",
                fontWeight: "700",
                padding: "8px 14px",
                borderRadius: "8px",
                backgroundColor: currentAgent?.status === "busy" ? "#fffbeb" : "#ffffff",
                color: currentAgent?.status === "busy" ? "#d97706" : "var(--text-secondary)",
                border: currentAgent?.status === "busy" ? "1px solid #f59e0b" : "1px solid #cbd5e1",
                boxShadow: "var(--shadow-sm)",
                opacity: activeChat !== null ? 0.5 : 1,
                cursor: activeChat !== null ? "not-allowed" : "pointer"
              }}
            >
              🟡 Away / Pause
            </button>
          </div>

        </div>
      </div>

      {/* INCOMING BROADCAST NOTIFICATIONS (FIRST TO ACCEPT WINS) */}
      {incomingBroadcasts.length > 0 && !activeChat && (
        <div style={{ marginBottom: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {incomingBroadcasts.map((chat) => {
            const isConnected = chat.customerConnected !== false;
            return (
              <div
                key={chat.id}
                className="glass-panel broadcast-flash"
                style={{
                  padding: "20px 24px",
                  backgroundColor: isConnected ? "#ecfdf5" : "#fffbeb",
                  border: isConnected ? "2px solid #10b981" : "2px solid #f59e0b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "16px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: isConnected ? "#059669" : "#d97706",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    boxShadow: isConnected ? "0 4px 12px rgba(5, 150, 105, 0.3)" : "0 4px 12px rgba(217, 119, 6, 0.3)"
                  }}>
                    <BellRing size={24} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "11px", fontWeight: "800", backgroundColor: isConnected ? "#059669" : "#d97706", color: "#ffffff", padding: "2px 8px", borderRadius: "4px", textTransform: "uppercase" }}>
                        Incoming Live Broadcast
                      </span>

                      {/* Real-Time Live Waiting Timer */}
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "11px",
                        fontWeight: "700",
                        color: "#334155",
                        backgroundColor: "#ffffff",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        border: "1px solid #cbd5e1"
                      }}>
                        <Clock size={12} color="#64748b" />
                        <span>Waiting: {formatElapsed(chat.createdAt)}</span>
                      </span>

                      {/* Customer Live Presence Mark */}
                      {isConnected ? (
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          fontSize: "11px",
                          fontWeight: "700",
                          color: "#059669",
                          backgroundColor: "#dcfce7",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          border: "1px solid #86efac"
                        }}>
                          <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#10b981", boxShadow: "0 0 6px #10b981" }} />
                          Customer Online
                        </span>
                      ) : (
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          fontSize: "11px",
                          fontWeight: "700",
                          color: "#b91c1c",
                          backgroundColor: "#fee2e2",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          border: "1px solid #fca5a5"
                        }}>
                          <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#ef4444" }} />
                          Customer Left / Disconnected
                        </span>
                      )}

                      <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                        Queue: <strong style={{ color: "#0f172a" }}>{chat.customer.department || "Support"}</strong>
                        {chat.customer.phone && (
                          <span style={{ color: "#0284c7", backgroundColor: "#f0f9ff", padding: "1px 6px", borderRadius: "4px", border: "1px solid #bae6fd", fontWeight: "600" }}>
                            📞 {chat.customer.phone}
                          </span>
                        )}
                      </span>
                    </div>

                    <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
                      {chat.subject} — <span style={{ color: isConnected ? "#059669" : "#d97706" }}>{chat.customer.name}</span>
                    </h3>
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px", maxWidth: "600px" }}>
                      "{chat.initialMessage}"
                    </p>
                    {!isConnected && (
                      <p style={{ fontSize: "11px", color: "#b91c1c", fontWeight: "600", marginTop: "4px" }}>
                        ⚠️ Customer closed or left the chat room while waiting. You can still claim and resolve this session.
                      </p>
                    )}
                  </div>
                </div>

              {/* FIRST TO ACCEPT BUTTON */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button
                  onClick={() => handleAcceptChat(chat.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "12px 26px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: "800",
                    boxShadow: "0 4px 16px rgba(16, 185, 129, 0.4)",
                    letterSpacing: "0.02em"
                  }}
                >
                  <Zap size={18} />
                  ACCEPT CHAT (CLAIM)
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* AGENT WORKSPACE MAIN CONTENT */}
      {activeChat ? (
        /* ACTIVE CHAT WORKSPACE (SPLIT CONSOLE) */
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px" }}>
          
          {/* Main Chat Stream */}
          <div className="glass-panel" style={{ display: "flex", flexDirection: "column", height: "660px", overflow: "hidden", backgroundColor: "#ffffff" }}>
            
            {/* Header */}
            <div style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--border-color)",
              backgroundColor: "#f8fafc",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
                    {activeChat.customer.name}
                  </h3>
                  <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "4px", backgroundColor: "#eff6ff", color: "#1d4ed8", fontWeight: "700", border: "1px solid #bfdbfe" }}>
                    {activeChat.customer.department}
                  </span>
                  {activeChat.customerConnected !== false ? (
                    <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "12px", backgroundColor: "#ecfdf5", color: "#059669", fontWeight: "700", border: "1px solid #a7f3d0", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10b981" }} />
                      Customer Online
                    </span>
                  ) : (
                    <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "12px", backgroundColor: "#fef2f2", color: "#b91c1c", fontWeight: "700", border: "1px solid #fecaca", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#ef4444" }} />
                      Customer Left / Disconnected
                    </span>
                  )}
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "2px" }}>
                  <span>{activeChat.subject}</span>
                  <span>•</span>
                  <span>{activeChat.customer.email}</span>
                  {activeChat.customer.phone && (
                    <>
                      <span>•</span>
                      <span style={{ color: "#0284c7", fontWeight: "600" }}>📞 {activeChat.customer.phone}</span>
                    </>
                  )}
                </p>
              </div>

              <button
                onClick={() => setShowResolveModal(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: "700",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  backgroundColor: "#ecfdf5",
                  color: "#059669",
                  border: "1px solid #a7f3d0"
                }}
              >
                <CheckCircle2 size={16} />
                Resolve & Free Agent
              </button>
            </div>

            {/* Messages Area */}
            <div style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              backgroundColor: "#f8fafc"
            }}>
              {messages.map((msg, index) => {
                const isMe = msg.sender === "agent";
                const isSys = msg.sender === "system";

                if (isSys) {
                  return (
                    <div key={msg.id || index} style={{ textAlign: "center", margin: "6px 0" }}>
                      <span style={{
                        display: "inline-block",
                        fontSize: "11px",
                        padding: "4px 14px",
                        borderRadius: "20px",
                        backgroundColor: "#ffffff",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border-color)",
                        boxShadow: "var(--shadow-sm)"
                      }}>
                        ⚡ {msg.text}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id || index}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isMe ? "flex-end" : "flex-start",
                      maxWidth: "75%",
                      alignSelf: isMe ? "flex-end" : "flex-start"
                    }}
                  >
                    <div style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      marginBottom: "3px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}>
                      <span>{msg.senderName || (isMe ? currentAgent?.name : activeChat.customer.name)}</span>
                      <span>•</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div style={{
                      padding: "10px 16px",
                      borderRadius: isMe ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                      backgroundColor: isMe ? "var(--accent-emerald)" : "#ffffff",
                      color: isMe ? "#ffffff" : "#0f172a",
                      fontSize: "14px",
                      lineHeight: "1.5",
                      border: isMe ? "none" : "1px solid var(--border-color)",
                      boxShadow: isMe ? "0 4px 12px rgba(5, 150, 105, 0.2)" : "var(--shadow-sm)",
                      wordBreak: "break-word"
                    }}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}

              {isCustomerTyping && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", alignSelf: "flex-start" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    {activeChat.customer.name} is typing
                  </span>
                  <div style={{ display: "flex", gap: "4px", padding: "6px 10px", borderRadius: "12px", backgroundColor: "#ffffff", border: "1px solid var(--border-color)" }}>
                    <div className="typing-dot" style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#94a3b8" }} />
                    <div className="typing-dot" style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#94a3b8" }} />
                    <div className="typing-dot" style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#94a3b8" }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Canned Macros Bar */}
            <div style={{
              padding: "10px 16px",
              backgroundColor: "#ffffff",
              borderTop: "1px solid var(--border-color)",
              display: "flex",
              gap: "8px",
              overflowX: "auto",
              whiteSpace: "nowrap"
            }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", alignSelf: "center", flexShrink: 0, fontWeight: "600" }}>Canned:</span>
              <button
                type="button"
                onClick={() => insertCannedResponse(`Hello ${activeChat.customer.name}! Thank you for contacting our support team. How may I assist you with this issue?`)}
                style={{ fontSize: "12px", padding: "5px 12px", borderRadius: "6px", backgroundColor: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", fontWeight: "600" }}
              >
                👋 Greeting
              </button>
              <button
                type="button"
                onClick={() => insertCannedResponse("I have reviewed your query details and am checking the backend records right now. Please allow me 2 minutes.")}
                style={{ fontSize: "12px", padding: "5px 12px", borderRadius: "6px", backgroundColor: "#fefce8", color: "#a16207", border: "1px solid #fef08a", fontWeight: "600" }}
              >
                ⏳ Checking Logs
              </button>
              <button
                type="button"
                onClick={() => insertCannedResponse("I have applied the fix to your account. Could you please refresh your page and confirm if it works as expected?")}
                style={{ fontSize: "12px", padding: "5px 12px", borderRadius: "6px", backgroundColor: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", fontWeight: "600" }}
              >
                ✅ Fix Applied
              </button>
              <button
                type="button"
                onClick={() => insertCannedResponse("Is there anything else I can assist you with before we wrap up today?")}
                style={{ fontSize: "12px", padding: "5px 12px", borderRadius: "6px", backgroundColor: "#faf5ff", color: "#7e22ce", border: "1px solid #e9d5ff", fontWeight: "600" }}
              >
                ❓ Anything Else?
              </button>
            </div>

            {/* Input Bar */}
            <form
              onSubmit={handleSendMessage}
              style={{
                padding: "14px 16px",
                backgroundColor: "#ffffff",
                borderTop: "1px solid var(--border-color)",
                display: "flex",
                gap: "10px",
                alignItems: "center"
              }}
            >
              <input
                type="text"
                value={inputMessage}
                onChange={handleInputChange}
                placeholder={`Reply to ${activeChat.customer.name}...`}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: "10px",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  color: "#0f172a",
                  fontSize: "14px"
                }}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  backgroundColor: inputMessage.trim() ? "var(--accent-emerald)" : "rgba(5, 150, 105, 0.2)",
                  color: "#ffffff",
                  cursor: inputMessage.trim() ? "pointer" : "not-allowed"
                }}
              >
                <Send size={18} />
              </button>
            </form>

          </div>

          {/* Right Dossier & Notes Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            {/* Customer Information Card */}
            <div className="glass-panel" style={{ padding: "18px", backgroundColor: "#ffffff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                <User size={16} color="#2563eb" />
                <h4 style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", color: "#334155" }}>
                  Customer Details
                </h4>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                <div>
                  <span style={{ color: "var(--text-muted)", fontSize: "11px", display: "block" }}>Full Name</span>
                  <strong style={{ color: "#0f172a" }}>{activeChat.customer.name}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", fontSize: "11px", display: "block" }}>Email</span>
                  <span style={{ color: "#334155" }}>{activeChat.customer.email}</span>
                </div>
                {activeChat.customer.phone && (
                  <div>
                    <span style={{ color: "var(--text-muted)", fontSize: "11px", display: "block" }}>Phone Number</span>
                    <strong style={{ color: "#0284c7" }}>{activeChat.customer.phone}</strong>
                  </div>
                )}
                <div>
                  <span style={{ color: "var(--text-muted)", fontSize: "11px", display: "block" }}>Initial Inquiry</span>
                  <span style={{ color: "#334155", fontSize: "12px", fontStyle: "italic" }}>"{activeChat.initialMessage}"</span>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", fontSize: "11px", display: "block" }}>Chat Session ID</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>{activeChat.id}</span>
                </div>
              </div>
            </div>

            {/* Internal Agent Private Notes */}
            <div className="glass-panel" style={{ padding: "18px", flex: 1, display: "flex", flexDirection: "column", backgroundColor: "#ffffff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <FileText size={16} color="#d97706" />
                <h4 style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", color: "#334155" }}>
                  Internal Case Notes
                </h4>
              </div>

              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px", maxHeight: "180px" }}>
                {notes.length === 0 ? (
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>
                    No internal notes yet. Notes are only visible to support team members.
                  </p>
                ) : (
                  notes.map((n) => (
                    <div key={n.id} style={{ padding: "8px 10px", borderRadius: "6px", backgroundColor: "#f8fafc", fontSize: "12px", border: "1px solid var(--border-color)" }}>
                      <span style={{ color: "#b45309", fontWeight: "700", display: "block", fontSize: "11px" }}>{n.author}</span>
                      <p style={{ color: "#334155", marginTop: "2px" }}>{n.text}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddNote} style={{ display: "flex", gap: "6px" }}>
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add private note..."
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    borderRadius: "6px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    color: "#0f172a",
                    fontSize: "12px"
                  }}
                />
                <button
                  type="submit"
                  disabled={!newNote.trim()}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "6px",
                    backgroundColor: "#fef3c7",
                    color: "#92400e",
                    fontSize: "12px",
                    fontWeight: "700",
                    border: "1px solid #fde68a"
                  }}
                >
                  Save
                </button>
              </form>
            </div>

          </div>

        </div>
      ) : (
        /* IDLE / WAITING STATE FOR AGENT */
        <div className="glass-panel" style={{ padding: "60px 32px", textAlign: "center", backgroundColor: "#ffffff" }}>
          <div style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            backgroundColor: currentAgent?.status === "available" ? "#ecfdf5" : "#fffbeb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px auto",
            border: currentAgent?.status === "available" ? "1px solid #a7f3d0" : "1px solid #fde68a"
          }}>
            <Headphones size={32} color={currentAgent?.status === "available" ? "#059669" : "#d97706"} />
          </div>

          <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>
            {currentAgent?.status === "available" ? "Ready & Standing By for Incoming Chats" : "Agent Currently Away / Paused"}
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", maxWidth: "520px", margin: "0 auto 24px auto", lineHeight: "1.6" }}>
            {currentAgent?.status === "available" ? (
              <>
                You are registered as <strong style={{ color: "#0f172a" }}>{currentAgent?.name}</strong> and your status is <strong style={{ color: "#059669" }}>Available (Free)</strong>. When a customer initiates a chat, you and all free agents will receive an instant audio & visual alert. The first agent to click "Accept Chat" claims the ticket!
              </>
            ) : (
              <>
                Your status is set to <strong style={{ color: "#d97706" }}>Away / Paused</strong>. Switch your status to <strong>Free (Available)</strong> above to receive incoming customer chat requests.
              </>
            )}
          </p>

          <div style={{ display: "inline-flex", alignItems: "center", gap: "12px", padding: "10px 20px", borderRadius: "10px", backgroundColor: "#f8fafc", border: "1px solid var(--border-color)", fontSize: "13px", boxShadow: "var(--shadow-sm)" }}>
            <span className={`status-indicator status-${currentAgent?.status || "offline"}`} />
            <span>Agent Stats Today: <strong style={{ color: "#0f172a" }}>{currentAgent?.stats?.resolvedToday || 0} Resolved</strong></span>
            <span style={{ color: "var(--text-muted)" }}>•</span>
            <span style={{ color: "#d97706", fontWeight: "700" }}>★ {currentAgent?.stats?.avgRating || "5.0"} Rating</span>
          </div>
        </div>
      )}

      {/* RESOLUTION SUMMARY MODAL */}
      {showResolveModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "480px", padding: "28px", backgroundColor: "#ffffff", boxShadow: "var(--shadow-lg)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <CheckCircle2 size={22} color="#059669" />
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>
                Resolve & Close Chat Session
              </h3>
            </div>

            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
              Closing this ticket will notify the customer and automatically return your status to <strong>Available (Free)</strong> for the next incoming query.
            </p>

            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
              Resolution Summary / Actions Taken
            </label>
            <textarea
              rows={3}
              value={resolutionSummary}
              onChange={(e) => setResolutionSummary(e.target.value)}
              placeholder="e.g. Cleared customer cache, verified webhook 200 OK responses, confirmed issue resolved."
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                backgroundColor: "#f8fafc",
                border: "1px solid #cbd5e1",
                color: "#0f172a",
                fontSize: "13px",
                marginBottom: "20px"
              }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setShowResolveModal(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  backgroundColor: "#f8fafc",
                  color: "var(--text-secondary)",
                  fontSize: "13px",
                  border: "1px solid var(--border-color)",
                  fontWeight: "600"
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResolve}
                style={{
                  padding: "8px 20px",
                  borderRadius: "8px",
                  backgroundColor: "var(--accent-emerald)",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: "700",
                  boxShadow: "0 4px 12px rgba(5, 150, 105, 0.3)"
                }}
              >
                Confirm & Mark Free
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
