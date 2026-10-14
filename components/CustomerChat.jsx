"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Send, User, Sparkles, AlertCircle, Clock, CheckCircle2, 
  MessageSquare, Star, ArrowRight, Shield, Radio, XCircle,
  ChevronDown, Check, Phone
} from "lucide-react";
import { sound } from "@/lib/sound";

export default function CustomerChat({ socket }) {
  // Chat States: "idle" | "waiting" | "active" | "resolved"
  const [chatState, setChatState] = useState("idle");
  const [formData, setFormData] = useState({
    name: "Michael Scott",
    email: "m.scott@dunder.com",
    department: "General",
    subject: "API Integration Webhook Failure",
    initialMessage: "Our webhook endpoint is receiving 500 errors on payment triggers. Can an agent check server logs?"
  });

  // Phone Number & Country Code State
  const [countryCode, setCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("2025550143");
  const [phoneError, setPhoneError] = useState("");
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const countryDropdownRef = useRef(null);

  const countryOptions = [
    { code: "+1", country: "US / CA", flag: "🇺🇸", label: "+1 (United States / Canada)" },
    { code: "+44", country: "UK", flag: "🇬🇧", label: "+44 (United Kingdom)" },
    { code: "+91", country: "IN", flag: "🇮🇳", label: "+91 (India)" },
    { code: "+61", country: "AU", flag: "🇦🇺", label: "+61 (Australia)" },
    { code: "+49", country: "DE", flag: "🇩🇪", label: "+49 (Germany)" },
    { code: "+33", country: "FR", flag: "🇫🇷", label: "+33 (France)" },
    { code: "+81", country: "JP", flag: "🇯🇵", label: "+81 (Japan)" },
    { code: "+971", country: "AE", flag: "🇦🇪", label: "+971 (United Arab Emirates)" },
    { code: "+65", country: "SG", flag: "🇸🇬", label: "+65 (Singapore)" },
    { code: "+86", country: "CN", flag: "🇨🇳", label: "+86 (China)" },
    { code: "+55", country: "BR", flag: "🇧🇷", label: "+55 (Brazil)" },
    { code: "+52", country: "MX", flag: "🇲🇽", label: "+52 (Mexico)" },
    { code: "+34", country: "ES", flag: "🇪🇸", label: "+34 (Spain)" },
    { code: "+39", country: "IT", flag: "🇮🇹", label: "+39 (Italy)" },
    { code: "+27", country: "ZA", flag: "🇿🇦", label: "+27 (South Africa)" }
  ];

  const [activeChat, setActiveChat] = useState(null);
  const [assignedAgent, setAssignedAgent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [waitingSeconds, setWaitingSeconds] = useState(0);
  const [notifiedCount, setNotifiedCount] = useState(0);

  // Rating state
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setIsCountryDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAgentTyping]);

  useEffect(() => {
    let timer;
    if (chatState === "waiting") {
      timer = setInterval(() => {
        setWaitingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setWaitingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [chatState]);

  useEffect(() => {
    if (!socket) return;

    const handleChatQueued = ({ chat, availableAgentsCount }) => {
      setActiveChat(chat);
      setChatState("waiting");
      setNotifiedCount(availableAgentsCount || 0);
      setMessages(chat.messages || []);
    };

    const handleAgentConnected = ({ chat, agent }) => {
      setActiveChat(chat);
      setAssignedAgent(agent);
      setChatState("active");
      setMessages(chat.messages || []);
      sound.playSuccessSound();
    };

    const handleNewMessage = ({ message }) => {
      setMessages((prev) => [...prev, message]);
      if (message.sender === "agent") {
        sound.playMessageSound();
      }
    };

    const handleUserTyping = ({ sender, isTyping }) => {
      if (sender === "agent") {
        setIsAgentTyping(isTyping);
      }
    };

    const handleChatEnded = ({ chat }) => {
      setActiveChat(chat);
      setChatState("resolved");
      setMessages(chat.messages || []);
    };

    const handleChatCancelled = () => {
      setChatState("idle");
      setActiveChat(null);
    };

    socket.on("chat_queued", handleChatQueued);
    socket.on("agent_connected", handleAgentConnected);
    socket.on("new_message", handleNewMessage);
    socket.on("user_typing", handleUserTyping);
    socket.on("chat_ended", handleChatEnded);
    socket.on("chat_cancelled", handleChatCancelled);

    return () => {
      socket.off("chat_queued", handleChatQueued);
      socket.off("agent_connected", handleAgentConnected);
      socket.off("new_message", handleNewMessage);
      socket.off("user_typing", handleUserTyping);
      socket.off("chat_ended", handleChatEnded);
      socket.off("chat_cancelled", handleChatCancelled);
    };
  }, [socket]);

  const handlePhoneChange = (e) => {
    // Only numerical characters (strip any letters or symbols)
    let rawDigits = e.target.value.replace(/\D/g, "");

    // Phone number cannot start with zero
    if (rawDigits.startsWith("0")) {
      rawDigits = rawDigits.replace(/^0+/, "");
      setPhoneError("Phone number cannot start with 0.");
    }

    // Not more than 10 digits
    const limitedDigits = rawDigits.slice(0, 10);
    setPhoneNumber(limitedDigits);

    if (limitedDigits.length === 10) {
      setPhoneError("");
    } else if (limitedDigits.length > 0 && limitedDigits.length < 10) {
      setPhoneError(`Must be exactly 10 digits (${10 - limitedDigits.length} more needed)`);
    } else if (limitedDigits.length === 0 && !e.target.value.includes("0")) {
      setPhoneError("Phone number is required");
    }
  };

  const setDemoSample = (sampleType) => {
    if (sampleType === "billing") {
      setFormData({
        name: "David Wallace",
        email: "d.wallace@enterprise.io",
        department: "Billing",
        subject: "Overcharged on Monthly Seat Subscription",
        initialMessage: "Hi, our monthly invoice shows 45 licenses instead of 30. Could you please correct the prorated charges?"
      });
      setCountryCode("+1");
      setPhoneNumber("3125550198");
      setPhoneError("");
    } else if (sampleType === "tech") {
      setFormData({
        name: "Pam Beesly",
        email: "pam@designcorp.com",
        department: "Technical",
        subject: "Unable to sync project assets via OAuth",
        initialMessage: "I am receiving a TokenExpiredException when trying to sync files from Google Drive to our workspace."
      });
      setCountryCode("+1");
      setPhoneNumber("2025550143");
      setPhoneError("");
    } else {
      setFormData({
        name: "Jim Halpert",
        email: "jim@athlead.org",
        department: "General",
        subject: "Urgent: Increase Organization API limits",
        initialMessage: "We are launching a press campaign in 20 minutes and need our rate limit doubled for the day."
      });
      setCountryCode("+1");
      setPhoneNumber("4155550122");
      setPhoneError("");
    }
  };

  const handleStartChat = (e) => {
    e.preventDefault();
    if (!socket || !formData.name || !formData.initialMessage) return;

    // Strict validation: cannot start with zero
    if (phoneNumber.startsWith("0")) {
      setPhoneError("Phone number cannot start with 0.");
      return;
    }

    // Strict validation: must not be less than 10 or more than 10
    if (phoneNumber.length !== 10) {
      setPhoneError("Phone number must be exactly 10 digits (numerical only).");
      return;
    }

    const fullPhone = `${countryCode} ${phoneNumber}`;

    socket.emit("customer_request_chat", {
      customerName: formData.name,
      customerEmail: formData.email,
      customerPhone: fullPhone,
      phone: fullPhone,
      department: formData.department || "General",
      subject: formData.subject,
      initialMessage: formData.initialMessage
    });
  };

  const handleCancelRequest = () => {
    if (socket && activeChat) {
      socket.emit("customer_cancel_request", { chatId: activeChat.id });
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket || !activeChat) return;

    socket.emit("send_message", {
      chatId: activeChat.id,
      sender: "customer",
      senderName: formData.name,
      text: inputMessage.trim()
    });

    socket.emit("typing", {
      chatId: activeChat.id,
      sender: "customer",
      isTyping: false
    });

    setInputMessage("");
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);

    if (socket && activeChat) {
      socket.emit("typing", {
        chatId: activeChat.id,
        sender: "customer",
        isTyping: true
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing", {
          chatId: activeChat.id,
          sender: "customer",
          isTyping: false
        });
      }, 1500);
    }
  };

  const handleEndChat = () => {
    if (!confirm("Are you sure you want to end this chat session?")) return;
    if (socket && activeChat) {
      socket.emit("end_chat", {
        chatId: activeChat.id,
        resolvedBy: formData.name
      });
    }
  };

  const handleRatingSubmit = (e) => {
    e.preventDefault();
    setFeedbackSubmitted(true);
    if (socket && activeChat) {
      socket.emit("end_chat", {
        chatId: activeChat.id,
        resolvedBy: "Customer Feedback",
        rating: rating,
        summary: feedback
      });
    }
  };

  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div style={{ maxWidth: "880px", margin: "16px auto", padding: "0 16px" }}>
      
      {/* STATE 1: IDLE / INTAKE FORM */}
      {chatState === "idle" && (
        <div className="glass-panel" style={{ padding: "36px", backgroundColor: "#ffffff" }}>
          
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "rgba(37, 99, 235, 0.08)", padding: "4px 12px", borderRadius: "20px", color: "#2563eb", fontSize: "12px", fontWeight: "700", marginBottom: "8px", border: "1px solid rgba(37, 99, 235, 0.15)" }}>
                <Sparkles size={14} />
                Live Customer Support Dispatch
              </div>
              <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.02em" }}>
                Start a Live Support Session
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
                Your request will be broadcast instantly to all currently available support agents.
              </p>
            </div>

            {/* Quick demo presets */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Quick samples:</span>
              <button
                type="button"
                onClick={() => setDemoSample("tech")}
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  backgroundColor: "#eff6ff",
                  color: "#1d4ed8",
                  border: "1px solid #bfdbfe"
                }}
              >
                Technical
              </button>
              <button
                type="button"
                onClick={() => setDemoSample("billing")}
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  backgroundColor: "#fefce8",
                  color: "#a16207",
                  border: "1px solid #fef08a"
                }}
              >
                Billing
              </button>
              <button
                type="button"
                onClick={() => setDemoSample("general")}
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  backgroundColor: "#f0fdf4",
                  color: "#15803d",
                  border: "1px solid #bbf7d0"
                }}
              >
                Urgent
              </button>
            </div>
          </div>

          <form onSubmit={handleStartChat} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Alex Green"
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: "10px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #cbd5e1",
                    color: "#0f172a",
                    fontSize: "14px"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. alex@company.com"
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: "10px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #cbd5e1",
                    color: "#0f172a",
                    fontSize: "14px"
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.9fr", gap: "16px" }}>
              <div style={{ position: "relative" }} ref={countryDropdownRef}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label htmlFor="customer-phone-input" style={{ fontSize: "13px", fontWeight: "600", color: "#334155", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Phone size={14} color="#64748b" />
                    Phone Number
                  </label>
                  <span style={{ fontSize: "11px", fontWeight: "600", color: phoneNumber.length === 10 ? "#16a34a" : "#64748b" }}>
                    {phoneNumber.length}/10 digits
                  </span>
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  borderRadius: "10px",
                  backgroundColor: "#ffffff",
                  border: phoneError ? "1.5px solid #ef4444" : isCountryDropdownOpen ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                  boxShadow: isCountryDropdownOpen ? "0 0 0 3px rgba(37, 99, 235, 0.12)" : "var(--shadow-sm)",
                  transition: "border-color 0.15s ease, box-shadow 0.15s ease"
                }}>
                  {/* Country Code Dropdown Trigger */}
                  <button
                    type="button"
                    id="country-code-btn"
                    onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "11px 12px",
                      backgroundColor: "#f8fafc",
                      border: "none",
                      borderRight: "1px solid #cbd5e1",
                      borderTopLeftRadius: "9px",
                      borderBottomLeftRadius: "9px",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#0f172a",
                      whiteSpace: "nowrap"
                    }}
                  >
                    <span>{countryOptions.find(c => c.code === countryCode)?.flag || "🌐"}</span>
                    <span>{countryCode}</span>
                    <ChevronDown
                      size={14}
                      color="#64748b"
                      style={{
                        transform: isCountryDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.15s ease"
                      }}
                    />
                  </button>

                  {/* Strictly Numerical 10-Digit Phone Input */}
                  <input
                    type="tel"
                    id="customer-phone-input"
                    required
                    value={phoneNumber}
                    maxLength={10}
                    inputMode="numeric"
                    placeholder="10-digit number"
                    onChange={handlePhoneChange}
                    onKeyDown={(e) => {
                      // Allow navigation, delete, backspace, copy, paste, select all
                      if (["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End"].includes(e.key)) return;
                      if (e.ctrlKey || e.metaKey) return;
                      // Block non-digits
                      if (!/^[0-9]$/.test(e.key)) {
                        e.preventDefault();
                        return;
                      }
                      // Block leading zero if input is empty or cursor is at position 0
                      const isAtStart = e.target.selectionStart === 0 && e.target.selectionEnd === 0;
                      if (e.key === "0" && (phoneNumber.length === 0 || isAtStart)) {
                        e.preventDefault();
                        setPhoneError("Phone number cannot start with 0.");
                      }
                    }}
                    style={{
                      flex: 1,
                      width: "100%",
                      padding: "11px 12px",
                      border: "none",
                      outline: "none",
                      backgroundColor: "transparent",
                      color: "#0f172a",
                      fontSize: "14px",
                      fontWeight: "500",
                      letterSpacing: "0.5px"
                    }}
                  />
                </div>

                {/* Country Code Dropdown Menu */}
                {isCountryDropdownOpen && (
                  <div style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    left: 0,
                    width: "280px",
                    maxHeight: "230px",
                    overflowY: "auto",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
                    zIndex: 200,
                    padding: "4px"
                  }}>
                    {countryOptions.map(option => {
                      const isSelected = countryCode === option.code;
                      return (
                        <button
                          key={option.code + option.country}
                          type="button"
                          onClick={() => {
                            setCountryCode(option.code);
                            setIsCountryDropdownOpen(false);
                          }}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 10px",
                            borderRadius: "6px",
                            backgroundColor: isSelected ? "#eff6ff" : "transparent",
                            color: isSelected ? "#1d4ed8" : "#0f172a",
                            border: "none",
                            fontSize: "13px",
                            cursor: "pointer",
                            textAlign: "left"
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = "#f8fafc";
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "16px" }}>{option.flag}</span>
                            <span style={{ fontWeight: isSelected ? "700" : "500" }}>{option.country}</span>
                            <span style={{ color: "#64748b", fontSize: "12px" }}>({option.code})</span>
                          </div>
                          {isSelected && <Check size={14} color="#2563eb" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Inline Error Message */}
                {phoneError && (
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px", color: "#ef4444", fontSize: "12px", fontWeight: "500" }}>
                    <AlertCircle size={13} />
                    <span>{phoneError}</span>
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Subject / Summary
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Short summary of your inquiry"
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: "10px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #cbd5e1",
                    color: "#0f172a",
                    fontSize: "14px"
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                How can our support team assist you today?
              </label>
              <textarea
                rows={3}
                required
                value={formData.initialMessage}
                onChange={(e) => setFormData({ ...formData, initialMessage: e.target.value })}
                placeholder="Describe your issue or question in detail..."
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #cbd5e1",
                  color: "#0f172a",
                  fontSize: "14px",
                  resize: "vertical",
                  lineHeight: "1.5"
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "12px" }}>
                <Radio size={14} color="#059669" />
                Requests are routed in real-time to active free operators.
              </div>

              <button
                type="submit"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 28px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: "700",
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
                  letterSpacing: "0.01em"
                }}
              >
                Broadcast & Connect Now
                <ArrowRight size={16} />
              </button>
            </div>
          </form>

        </div>
      )}

      {/* STATE 2: BROADCASTING & WAITING */}
      {chatState === "waiting" && (
        <div className="glass-panel" style={{ padding: "48px 32px", textAlign: "center", backgroundColor: "#ffffff" }}>
          
          <div style={{ position: "relative", width: "120px", height: "120px", margin: "0 auto 28px auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="radar-anim" style={{
              position: "absolute",
              width: "90px",
              height: "90px",
              borderRadius: "50%",
              backgroundColor: "rgba(37, 99, 235, 0.15)"
            }} />
            <div style={{
              width: "68px",
              height: "68px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(37, 99, 235, 0.35)",
              position: "relative",
              zIndex: 2
            }}>
              <Radio size={32} color="#ffffff" />
            </div>
          </div>

          <div style={{ display: "inline-block", backgroundColor: "#fef3c7", color: "#92400e", padding: "4px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", marginBottom: "12px", border: "1px solid #fde68a" }}>
            BROADCAST ACTIVE • WAITING FOR FIRST AGENT TO CLAIM
          </div>

          <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", marginBottom: "10px" }}>
            Connecting with Support...
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", maxWidth: "520px", margin: "0 auto 24px auto", lineHeight: "1.6" }}>
            Your query <strong style={{ color: "#0f172a" }}>"{formData.subject}"</strong> has been broadcast to all free agents in our BPO team.
            The first representative to accept your request will join this chat.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginBottom: "32px", flexWrap: "wrap" }}>
            <div style={{ padding: "14px 22px", borderRadius: "10px", backgroundColor: "#f8fafc", border: "1px solid var(--border-color)", textAlign: "center", boxShadow: "var(--shadow-sm)" }}>
              <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Available Agents Alerted</span>
              <span style={{ fontSize: "20px", fontWeight: "800", color: "#059669" }}>{notifiedCount > 0 ? notifiedCount : "All Available"} Agents</span>
            </div>
            <div style={{ padding: "14px 22px", borderRadius: "10px", backgroundColor: "#f8fafc", border: "1px solid var(--border-color)", textAlign: "center", boxShadow: "var(--shadow-sm)" }}>
              <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Wait Time</span>
              <span style={{ fontSize: "20px", fontWeight: "800", color: "#2563eb" }}>{formatTimer(waitingSeconds)}</span>
            </div>
            <div style={{ padding: "14px 22px", borderRadius: "10px", backgroundColor: "#f8fafc", border: "1px solid var(--border-color)", textAlign: "center", boxShadow: "var(--shadow-sm)" }}>
              <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Routing Mode</span>
              <span style={{ fontSize: "20px", fontWeight: "800", color: "#7c3aed" }}>First to Claim</span>
            </div>
          </div>

          <div>
            <button
              onClick={handleCancelRequest}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                borderRadius: "8px",
                backgroundColor: "#fff1f2",
                color: "#e11d48",
                border: "1px solid #fecdd3",
                fontSize: "13px",
                fontWeight: "600"
              }}
            >
              <XCircle size={16} />
              Cancel Chat Request
            </button>
          </div>

        </div>
      )}

      {/* STATE 3: ACTIVE LIVE CHAT */}
      {chatState === "active" && (
        <div className="glass-panel" style={{ display: "flex", flexDirection: "column", height: "640px", overflow: "hidden", backgroundColor: "#ffffff" }}>
          
          {/* Header */}
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-color)",
            backgroundColor: "#f8fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ position: "relative" }}>
                <img
                  src={assignedAgent?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                  alt={assignedAgent?.name || "Support Agent"}
                  style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover", border: "2px solid #2563eb" }}
                />
                <span className="status-indicator status-available" style={{ position: "absolute", bottom: "1px", right: "1px", border: "2px solid #ffffff" }} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>
                    {assignedAgent?.name || "Support Agent"}
                  </h3>
                  <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "4px", backgroundColor: "#eff6ff", color: "#1d4ed8", fontWeight: "700", border: "1px solid #bfdbfe" }}>
                    {assignedAgent?.department} Specialist
                  </span>
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  {assignedAgent?.role || "Customer Support"} • Connected to your session
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                <Clock size={14} />
                <span>Ticket #{activeChat?.id?.substring(5, 12)}</span>
              </div>
              <button
                onClick={handleEndChat}
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  backgroundColor: "#fff1f2",
                  color: "#e11d48",
                  border: "1px solid #fecdd3"
                }}
              >
                End Chat
              </button>
            </div>
          </div>

          {/* Messages Stream */}
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
              const isMe = msg.sender === "customer";
              const isSys = msg.sender === "system";

              if (isSys) {
                return (
                  <div key={msg.id || index} style={{ textAlign: "center", margin: "8px 0" }}>
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
                    maxWidth: "80%",
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
                    <span>{msg.senderName || (isMe ? "You" : assignedAgent?.name)}</span>
                    <span>•</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div style={{
                    padding: "10px 16px",
                    borderRadius: isMe ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                    backgroundColor: isMe ? "var(--accent-blue)" : "#ffffff",
                    color: isMe ? "#ffffff" : "#0f172a",
                    fontSize: "14px",
                    lineHeight: "1.5",
                    boxShadow: isMe ? "0 4px 12px rgba(37, 99, 235, 0.2)" : "var(--shadow-sm)",
                    border: isMe ? "none" : "1px solid var(--border-color)",
                    wordBreak: "break-word"
                  }}>
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {isAgentTyping && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", alignSelf: "flex-start" }}>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                  {assignedAgent?.name || "Agent"} is typing
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

          {/* Input Bar */}
          <form
            onSubmit={handleSendMessage}
            style={{
              padding: "14px 20px",
              borderTop: "1px solid var(--border-color)",
              backgroundColor: "#ffffff",
              display: "flex",
              gap: "10px",
              alignItems: "center"
            }}
          >
            <input
              type="text"
              value={inputMessage}
              onChange={handleInputChange}
              placeholder={`Message ${assignedAgent?.name || "Support"}...`}
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
                backgroundColor: inputMessage.trim() ? "var(--accent-blue)" : "rgba(37, 99, 235, 0.2)",
                color: "#ffffff",
                cursor: inputMessage.trim() ? "pointer" : "not-allowed"
              }}
            >
              <Send size={18} />
            </button>
          </form>

        </div>
      )}

      {/* STATE 4: RESOLVED / FEEDBACK */}
      {chatState === "resolved" && (
        <div className="glass-panel" style={{ padding: "40px 32px", textAlign: "center", backgroundColor: "#ffffff" }}>
          
          <div style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            backgroundColor: "#f0fdf4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 18px auto",
            border: "1px solid #bbf7d0"
          }}>
            <CheckCircle2 size={32} color="#059669" />
          </div>

          <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>
            Chat Session Resolved
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", maxWidth: "460px", margin: "0 auto 24px auto" }}>
            Your query was handled by <strong style={{ color: "#0f172a" }}>{assignedAgent?.name || "our support agent"}</strong>.
            Please take a moment to rate your experience to help us improve.
          </p>

          {!feedbackSubmitted ? (
            <form onSubmit={handleRatingSubmit} style={{ maxWidth: "440px", margin: "0 auto" }}>
              <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "20px" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    style={{
                      background: "none",
                      padding: "6px",
                      transform: rating >= star ? "scale(1.15)" : "scale(1)"
                    }}
                  >
                    <Star
                      size={28}
                      color={rating >= star ? "#f59e0b" : "#cbd5e1"}
                      fill={rating >= star ? "#f59e0b" : "none"}
                    />
                  </button>
                ))}
              </div>

              <textarea
                rows={2}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Optional feedback or comments for your agent..."
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  color: "#0f172a",
                  fontSize: "13px",
                  marginBottom: "16px"
                }}
              />

              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <button
                  type="submit"
                  style={{
                    padding: "10px 24px",
                    borderRadius: "8px",
                    backgroundColor: "var(--accent-blue)",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: "600"
                  }}
                >
                  Submit Rating
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChatState("idle");
                    setActiveChat(null);
                  }}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "8px",
                    backgroundColor: "#f8fafc",
                    color: "var(--text-secondary)",
                    fontSize: "13px",
                    border: "1px solid var(--border-color)"
                  }}
                >
                  Start New Inquiry
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div style={{ display: "inline-block", padding: "8px 16px", borderRadius: "8px", backgroundColor: "#f0fdf4", color: "#15803d", fontSize: "13px", fontWeight: "600", marginBottom: "20px", border: "1px solid #bbf7d0" }}>
                ✓ Thank you! Your rating has been recorded.
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setChatState("idle");
                    setActiveChat(null);
                    setFeedbackSubmitted(false);
                  }}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "8px",
                    backgroundColor: "var(--accent-blue)",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: "600"
                  }}
                >
                  Start Another Inquiry
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
