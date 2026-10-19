"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getSocket } from "@/lib/socket";
import { 
  ShieldCheck, Users, Headphones, BarChart3, Clock, 
  MessageSquare, CheckCircle2, AlertTriangle, Plus, Trash2, 
  Search, Star, FileText, Settings, Radio, Sparkles, X, ChevronDown, Check,
  Lock, LogOut, ArrowRight, UserCheck, UserX, Eye, RefreshCw, AlertCircle
} from "lucide-react";

export default function AdminPortal() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState("operations"); // "operations" | "agents" | "archive" | "canned"

  // Admin Auth State
  const [adminUser, setAdminUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [loginForm, setLoginForm] = useState({
    email: "admin@bpo.com",
    password: "admin123"
  });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Admin Data State
  const [overviewData, setOverviewData] = useState({
    chats: [],
    agents: [],
    cannedResponses: [],
    metrics: { waitingChats: 0, activeChats: 0, resolvedChats: 0, totalAgents: 4, availableAgents: 0, busyAgents: 0 }
  });

  // Fleet View Filters
  const [agentSearch, setAgentSearch] = useState("");
  const [agentStatusFilter, setAgentStatusFilter] = useState("all");
  const [agentDeptFilter, setAgentDeptFilter] = useState("all");

  // Add Agent Modal State
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [newAgentForm, setNewAgentForm] = useState({
    name: "",
    email: "",
    password: "bpo123",
    role: "Technical Support Specialist",
    department: "Technical",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
  });

  // Terminate Modal State
  const [terminatingAgent, setTerminatingAgent] = useState(null);
  const [terminationReason, setTerminationReason] = useState("");

  // Inspect Agent Chats Modal
  const [selectedAgentForChats, setSelectedAgentForChats] = useState(null);
  const [agentChatsList, setAgentChatsList] = useState([]);
  const [agentChatsSearch, setAgentChatsSearch] = useState("");
  const [agentChatsFilter, setAgentChatsFilter] = useState("all"); // "all" | "active" | "resolved"

  // System Notifications
  const [adminNotification, setAdminNotification] = useState(null);

  const [showAddCannedModal, setShowAddCannedModal] = useState(false);
  const [newCannedForm, setNewCannedForm] = useState({
    title: "",
    text: ""
  });

  // Ticket Audit Inspector Modal
  const [inspectedChat, setInspectedChat] = useState(null);
  const [archiveSearch, setArchiveSearch] = useState("");
  const [archiveDeptFilter, setArchiveDeptFilter] = useState("all");

  // Check saved session on mount
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get("tab");
        if (tab) {
          if (tab === "fleet" || tab === "agents") setActiveTab("agents");
          else if (["operations", "archive", "canned"].includes(tab)) setActiveTab(tab);
        }
      }
      const saved = localStorage.getItem("bpo_admin_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.role === "admin") {
          setAdminUser(parsed);
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

    const onConnect = () => {
      setIsConnected(true);
      if (adminUser) s.emit("admin_get_overview");
    };
    const onDisconnect = () => setIsConnected(false);

    const onOverviewData = (data) => {
      setOverviewData(data);
    };

    const onMetricsUpdate = (metrics) => {
      setOverviewData((prev) => ({ ...prev, metrics }));
    };

    const onAgentsUpdate = (agents) => {
      setOverviewData((prev) => ({ ...prev, agents }));
    };

    const onActionSuccess = (data) => {
      setAdminNotification({ type: "success", message: data.message });
      setTimeout(() => setAdminNotification(null), 4500);
    };

    const onActionError = (data) => {
      setAdminNotification({ type: "error", message: data.message });
      setTimeout(() => setAdminNotification(null), 5500);
    };

    const onAgentChatsData = ({ agentId, chats }) => {
      setAgentChatsList(chats);
    };

    const onAdminChatCreated = ({ chat }) => {
      setOverviewData((prev) => {
        const chatId = chat.id || chat.chatId;
        const exists = prev.chats.some((c) => (c.id || c.chatId) === chatId);
        if (exists) {
          return {
            ...prev,
            chats: prev.chats.map((c) => ((c.id || c.chatId) === chatId ? { ...c, ...chat } : c))
          };
        }
        return {
          ...prev,
          chats: [chat, ...prev.chats]
        };
      });
    };

    const onAdminChatUpdated = (update) => {
      setOverviewData((prev) => ({
        ...prev,
        chats: prev.chats.map((c) => {
          if ((c.id || c.chatId) === update.chatId) {
            return { ...c, ...update };
          }
          return c;
        })
      }));
      setInspectedChat((prev) => {
        if (prev && (prev.id || prev.chatId) === update.chatId) {
          return { ...prev, ...update };
        }
        return prev;
      });
    };

    const onAdminChatMessage = ({ chatId, message }) => {
      setOverviewData((prev) => ({
        ...prev,
        chats: prev.chats.map((c) => {
          if ((c.id || c.chatId) === chatId) {
            const msgs = c.messages || [];
            if (msgs.some((m) => m.id === message.id)) return c;
            return {
              ...c,
              messages: [...msgs, message]
            };
          }
          return c;
        })
      }));
      setInspectedChat((prev) => {
        if (prev && (prev.id || prev.chatId) === chatId) {
          const msgs = prev.messages || [];
          if (msgs.some((m) => m.id === message.id)) return prev;
          return {
            ...prev,
            messages: [...msgs, message]
          };
        }
        return prev;
      });
    };

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("admin_overview_data", onOverviewData);
    s.on("metrics_update", onMetricsUpdate);
    s.on("agents_update", onAgentsUpdate);
    s.on("admin_action_success", onActionSuccess);
    s.on("admin_action_error", onActionError);
    s.on("admin_agent_chats_data", onAgentChatsData);
    s.on("admin_chat_created", onAdminChatCreated);
    s.on("admin_chat_updated", onAdminChatUpdated);
    s.on("admin_chat_message", onAdminChatMessage);

    if (s.connected && adminUser) {
      setIsConnected(true);
      s.emit("admin_get_overview");
    }

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("admin_overview_data", onOverviewData);
      s.off("metrics_update", onMetricsUpdate);
      s.off("agents_update", onAgentsUpdate);
      s.off("admin_action_success", onActionSuccess);
      s.off("admin_action_error", onActionError);
      s.off("admin_agent_chats_data", onAgentChatsData);
      s.off("admin_chat_created", onAdminChatCreated);
      s.off("admin_chat_updated", onAdminChatUpdated);
      s.off("admin_chat_message", onAdminChatMessage);
    };
  }, [adminUser]);

  const handleAdminLogin = async (e) => {
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
          portal: "admin"
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "Authentication failed.");
      } else {
        setAdminUser(data.user);
        localStorage.setItem("bpo_admin_session", JSON.stringify(data.user));
        if (socket) socket.emit("admin_get_overview");
      }
    } catch (err) {
      setLoginError("Network connection error: " + err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("bpo_admin_session");
    setAdminUser(null);
  };

  const handleCreateAgent = (e) => {
    e.preventDefault();
    if (!socket || !newAgentForm.name) return;

    socket.emit("admin_create_agent", {
      name: newAgentForm.name,
      email: newAgentForm.email,
      password: newAgentForm.password,
      role: newAgentForm.role,
      department: newAgentForm.department,
      avatar: newAgentForm.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
    });

    setShowAddAgentModal(false);
    setNewAgentForm({
      name: "",
      email: "",
      password: "bpo123",
      role: "Technical Support Specialist",
      department: "Technical",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
    });
  };

  const handleOpenTerminate = (ag) => {
    setTerminatingAgent(ag);
    setTerminationReason("End of employment contract");
  };

  const handleConfirmTerminate = (e) => {
    e.preventDefault();
    if (!socket || !terminatingAgent) return;

    socket.emit("admin_terminate_agent", {
      agentId: terminatingAgent.id,
      reason: terminationReason || "Administrative termination"
    });

    setTerminatingAgent(null);
    setTerminationReason("");
  };

  const handleReactivateAgent = (agentId) => {
    if (socket) {
      socket.emit("admin_reactivate_agent", { agentId });
    }
  };

  const handleDeleteAgent = (agentId) => {
    if (!confirm("Are you sure you want to permanently delete this employee record from the database? This cannot be undone.")) return;
    if (socket) {
      socket.emit("admin_delete_agent", { agentId });
    }
  };

  const handleToggleAgentStatus = (agentId, currentStatus) => {
    const nextStatus = currentStatus === "available" ? "busy" : "available";
    if (socket) {
      socket.emit("admin_set_agent_status", { agentId, status: nextStatus });
    }
  };

  const handleInspectAgentChats = (ag) => {
    setSelectedAgentForChats(ag);
    setAgentChatsSearch("");
    setAgentChatsFilter("all");

    // Pre-populate with currently loaded overview chats matching this agent
    const preFiltered = overviewData.chats.filter(c => 
      c.assignedAgent?.id === ag.id || 
      c.assignedAgent?.email === ag.email ||
      c.assignedAgent?.name === ag.name
    );
    setAgentChatsList(preFiltered);

    // Request authoritative full history from MongoDB Atlas
    if (socket) {
      socket.emit("admin_get_agent_chats", { agentId: ag.id, agentEmail: ag.email });
    }
  };

  const handleCreateCanned = (e) => {
    e.preventDefault();
    if (!socket || !newCannedForm.title || !newCannedForm.text) return;

    socket.emit("admin_save_canned", {
      title: newCannedForm.title,
      text: newCannedForm.text
    });

    setShowAddCannedModal(false);
    setNewCannedForm({ title: "", text: "" });
  };

  const handleDeleteCanned = (id) => {
    if (!confirm("Delete this canned response?")) return;
    if (socket) {
      socket.emit("admin_delete_canned", { id });
    }
  };

  // Filtered archive tickets
  const filteredChats = overviewData.chats.filter((c) => {
    const matchesSearch = 
      (c.subject || "").toLowerCase().includes(archiveSearch.toLowerCase()) ||
      (c.customer?.name || "").toLowerCase().includes(archiveSearch.toLowerCase()) ||
      (c.customer?.phone || "").toLowerCase().includes(archiveSearch.toLowerCase()) ||
      (c.customer?.email || "").toLowerCase().includes(archiveSearch.toLowerCase());
    
    const matchesDept = archiveDeptFilter === "all" || c.customer?.department === archiveDeptFilter;
    return matchesSearch && matchesDept;
  });

  // Filtered support fleet employees
  const filteredAgents = overviewData.agents.filter((ag) => {
    const matchesSearch =
      (ag.name || "").toLowerCase().includes(agentSearch.toLowerCase()) ||
      (ag.email || "").toLowerCase().includes(agentSearch.toLowerCase()) ||
      (ag.role || "").toLowerCase().includes(agentSearch.toLowerCase()) ||
      (ag.department || "").toLowerCase().includes(agentSearch.toLowerCase());

    const matchesDept = agentDeptFilter === "all" || ag.department === agentDeptFilter;
    const matchesStatus =
      agentStatusFilter === "all" ? true :
      agentStatusFilter === "terminated" ? ag.status === "terminated" :
      agentStatusFilter === "active" ? ag.status !== "terminated" :
      ag.status === agentStatusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  // Filtered chats inside the Agent Chat Portfolio Modal
  const filteredAgentChats = agentChatsList.filter((c) => {
    const matchesSearch =
      (c.subject || "").toLowerCase().includes(agentChatsSearch.toLowerCase()) ||
      (c.customer?.name || "").toLowerCase().includes(agentChatsSearch.toLowerCase()) ||
      (c.customer?.phone || "").toLowerCase().includes(agentChatsSearch.toLowerCase()) ||
      (c.customer?.email || "").toLowerCase().includes(agentChatsSearch.toLowerCase()) ||
      (c.id || "").toLowerCase().includes(agentChatsSearch.toLowerCase());

    const matchesFilter =
      agentChatsFilter === "all" ? true :
      c.status === agentChatsFilter;

    return matchesSearch && matchesFilter;
  });

  if (isAuthChecking) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-primary)" }}>
        <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>Verifying administrator credentials...</span>
      </div>
    );
  }

  // ----------------------------------------------------
  // UN-AUTHENTICATED: ADMIN LOGIN FORM
  // ----------------------------------------------------
  if (!adminUser) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--bg-primary)" }}>
        
        {/* Simple top header */}
        <header className="glass-nav" style={{ padding: "14px 24px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ShieldCheck size={20} color="#ffffff" />
              </div>
              <h1 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>OmniFlow BPO Admin Suite</h1>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <Link href="/" style={{ fontSize: "12px", color: "#2563eb", textDecoration: "none", fontWeight: "600" }}>User Portal (/)</Link>
              <span style={{ color: "#cbd5e1" }}>•</span>
              <Link href="/support" style={{ fontSize: "12px", color: "#059669", textDecoration: "none", fontWeight: "600" }}>Support Team (/support)</Link>
            </div>
          </div>
        </header>

        {/* Login Card */}
        <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "440px", padding: "36px", backgroundColor: "#ffffff" }}>
            
            <div style={{ textAlign: "center", marginBottom: "26px" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "14px", backgroundColor: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px auto", border: "1px solid #ddd6fe" }}>
                <Lock size={26} color="#7c3aed" />
              </div>
              <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>Administrator Sign In</h2>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
                Authorized access to BPO operations, agent fleet & ticket audit logs
              </p>
            </div>

            {loginError && (
              <div style={{ padding: "10px 14px", borderRadius: "8px", backgroundColor: "#fff1f2", border: "1px solid #fecdd3", color: "#e11d48", fontSize: "12px", marginBottom: "16px" }}>
                {loginError}
              </div>
            )}

            <form onSubmit={handleAdminLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Administrator Email
                </label>
                <input
                  type="email"
                  required
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  placeholder="admin@bpo.com"
                  style={{ width: "100%", padding: "11px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#334155" }}>Password</label>
                  <span style={{ fontSize: "11px", color: "#7c3aed", fontWeight: "600" }}>Default: admin123</span>
                </div>
                <input
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="••••••••"
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
                  background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: loginLoading ? "not-allowed" : "pointer",
                  marginTop: "8px",
                  boxShadow: "0 4px 14px rgba(124, 58, 237, 0.3)"
                }}
              >
                {loginLoading ? "Authenticating..." : "Sign In to Admin Suite"}
                <ArrowRight size={16} />
              </button>
            </form>

            <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--border-color)", textAlign: "center" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Database: Connected to MongoDB Atlas Cluster
              </span>
            </div>

          </div>
        </main>
      </div>
    );
  }

  // ----------------------------------------------------
  // AUTHENTICATED: FULL ADMIN OPERATIONS SUITE
  // ----------------------------------------------------
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--bg-primary)" }}>
      
      {/* ADMIN NAVIGATION HEADER */}
      <header className="glass-nav" style={{ position: "sticky", top: 0, zIndex: 50, padding: "12px 24px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(124, 58, 237, 0.3)"
            }}>
              <ShieldCheck size={24} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h1 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.02em" }}>
                  BPO Operations & Admin Suite
                </h1>
                <span style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  backgroundColor: "#f5f3ff",
                  color: "#7c3aed",
                  border: "1px solid #ddd6fe"
                }}>
                  /admin
                </span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                Fleet Management, SLA Analytics, Dispatch Policies & Ticket Audits
              </p>
            </div>
          </div>

          {/* Admin Tabs */}
          <div style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#f1f5f9",
            padding: "4px",
            borderRadius: "10px",
            border: "1px solid var(--border-color)",
            gap: "4px"
          }}>
            <button
              id="tab-operations"
              onClick={() => setActiveTab("operations")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: activeTab === "operations" ? "700" : "500",
                backgroundColor: activeTab === "operations" ? "#ffffff" : "transparent",
                color: activeTab === "operations" ? "#7c3aed" : "var(--text-secondary)",
                boxShadow: activeTab === "operations" ? "var(--shadow-sm)" : "none"
              }}
            >
              <BarChart3 size={15} />
              Operations
            </button>

            <button
              id="tab-fleet"
              onClick={() => setActiveTab("agents")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: activeTab === "agents" ? "700" : "500",
                backgroundColor: activeTab === "agents" ? "#ffffff" : "transparent",
                color: activeTab === "agents" ? "#7c3aed" : "var(--text-secondary)",
                boxShadow: activeTab === "agents" ? "var(--shadow-sm)" : "none"
              }}
            >
              <Users size={15} />
              Fleet ({overviewData.agents.length})
            </button>

            <button
              id="tab-archive"
              onClick={() => setActiveTab("archive")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: activeTab === "archive" ? "700" : "500",
                backgroundColor: activeTab === "archive" ? "#ffffff" : "transparent",
                color: activeTab === "archive" ? "#7c3aed" : "var(--text-secondary)",
                boxShadow: activeTab === "archive" ? "var(--shadow-sm)" : "none"
              }}
            >
              <FileText size={15} />
              Ticket Audit ({overviewData.chats.length})
            </button>

            <button
              id="tab-canned"
              onClick={() => setActiveTab("canned")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: activeTab === "canned" ? "700" : "500",
                backgroundColor: activeTab === "canned" ? "#ffffff" : "transparent",
                color: activeTab === "canned" ? "#7c3aed" : "var(--text-secondary)",
                boxShadow: activeTab === "canned" ? "var(--shadow-sm)" : "none"
              }}
            >
              <Sparkles size={15} />
              Canned Macros
            </button>
          </div>

          {/* Admin User Profile & Logout */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 12px",
              borderRadius: "8px",
              backgroundColor: "#ffffff",
              border: "1px solid var(--border-color)",
              boxShadow: "var(--shadow-sm)"
            }}>
              <span className="status-indicator status-available" />
              <div style={{ textAlign: "left" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#0f172a", display: "block", lineHeight: "1.2" }}>
                  {adminUser.name}
                </span>
                <span style={{ fontSize: "10px", color: "#7c3aed", fontWeight: "600" }}>Admin</span>
              </div>
            </div>

            <button
              onClick={handleAdminLogout}
              title="Sign Out"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 12px",
                borderRadius: "8px",
                backgroundColor: "#fff1f2",
                border: "1px solid #fecdd3",
                color: "#e11d48",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              <LogOut size={13} />
              Sign Out
            </button>
          </div>

        </div>
      </header>

      {/* MAIN ADMIN CONTENT */}
      <main style={{ maxWidth: "1400px", margin: "24px auto", padding: "0 20px", flex: 1, width: "100%" }}>
        
        {/* Real-time Notification Banner */}
        {adminNotification && (
          <div style={{
            marginBottom: "20px",
            padding: "12px 18px",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: adminNotification.type === "success" ? "#ecfdf5" : "#fff1f2",
            border: `1px solid ${adminNotification.type === "success" ? "#a7f3d0" : "#fecdd3"}`,
            color: adminNotification.type === "success" ? "#065f46" : "#9f1239",
            fontSize: "13px",
            fontWeight: "600",
            boxShadow: "var(--shadow-sm)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {adminNotification.type === "success" ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}
              <span>{adminNotification.message}</span>
            </div>
            <button
              onClick={() => setAdminNotification(null)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* TAB 1: OPERATIONS & METRICS */}
        {activeTab === "operations" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "24px" }}>
              <div className="glass-panel" style={{ padding: "20px" }}>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>Free Agents (Available)</span>
                <div style={{ fontSize: "32px", fontWeight: "800", color: "#059669", marginTop: "4px" }}>
                  {overviewData.metrics.availableAgents}
                  <span style={{ fontSize: "14px", fontWeight: "500", color: "var(--text-muted)", marginLeft: "6px" }}>
                    / {overviewData.agents.length} fleet
                  </span>
                </div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>Ready to receive parallel broadcasts</span>
                  {typeof overviewData.metrics.onlineAgents === "number" && (
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      color: overviewData.metrics.onlineAgents > 0 ? "#059669" : "var(--text-muted)",
                      fontWeight: "600"
                    }}>
                      <span style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: overviewData.metrics.onlineAgents > 0 ? "#10b981" : "#94a3b8"
                      }}></span>
                      {overviewData.metrics.onlineAgents} web active
                    </span>
                  )}
                </span>
              </div>

              <div className="glass-panel" style={{ padding: "20px" }}>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>Live Waiting Queue</span>
                <div style={{ fontSize: "32px", fontWeight: "800", color: overviewData.metrics.waitingChats > 0 ? "#d97706" : "#0f172a", marginTop: "4px" }}>
                  {overviewData.metrics.waitingChats}
                </div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                  Customers waiting for agent claim
                </span>
              </div>

              <div className="glass-panel" style={{ padding: "20px" }}>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>Active Live Sessions</span>
                <div style={{ fontSize: "32px", fontWeight: "800", color: "#2563eb", marginTop: "4px" }}>
                  {overviewData.metrics.activeChats}
                </div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                  Ongoing 1-on-1 customer conversations
                </span>
              </div>

              <div className="glass-panel" style={{ padding: "20px" }}>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>Total Resolved (Mongo)</span>
                <div style={{ fontSize: "32px", fontWeight: "800", color: "#7c3aed", marginTop: "4px" }}>
                  {overviewData.chats.filter(c => c.status === "resolved").length}
                </div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                  Persisted safely in MongoDB Atlas
                </span>
              </div>
            </div>

            {/* LIVE QUEUE & DISPATCH INSPECTOR */}
            <div className="glass-panel" style={{ padding: "24px", marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
                    Live Queue & Active Dispatch Stream
                  </h3>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    Inspect real-time customer requests and which agent claimed each session.
                  </p>
                </div>
                <span style={{ fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "20px", backgroundColor: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0" }}>
                  ● Dispatch Engine Live
                </span>
              </div>

              {overviewData.chats.filter(c => c.status === "waiting" || c.status === "active").length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center", backgroundColor: "#f8fafc", borderRadius: "10px", border: "1px dashed var(--border-color)" }}>
                  <CheckCircle2 size={32} color="#059669" style={{ margin: "0 auto 8px auto" }} />
                  <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>All Queues Clear</h4>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>No customers currently waiting or in active resolution.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {overviewData.chats.filter(c => c.status === "waiting" || c.status === "active").map((chat) => (
                    <div
                      key={chat.id}
                      style={{
                        padding: "16px 20px",
                        borderRadius: "10px",
                        backgroundColor: chat.status === "waiting" ? "#fffbeb" : "#eff6ff",
                        border: chat.status === "waiting" ? "1px solid #fde68a" : "1px solid #bfdbfe",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "12px"
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span style={{
                            fontSize: "10px",
                            fontWeight: "800",
                            textTransform: "uppercase",
                            padding: "2px 7px",
                            borderRadius: "4px",
                            backgroundColor: chat.status === "waiting" ? "#d97706" : "#2563eb",
                            color: "#ffffff"
                          }}>
                            {chat.status === "waiting" ? "WAITING (BROADCASTING)" : "ACTIVE IN CHAT"}
                          </span>
                          <span style={{ fontSize: "12px", fontWeight: "700", color: "#0f172a" }}>
                            {chat.customer?.name} ({chat.customer?.email})
                            {chat.customer?.phone && <span style={{ marginLeft: "6px", color: "#0284c7" }}>• 📞 {chat.customer.phone}</span>}
                          </span>
                        </div>
                        <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>
                          {chat.subject}
                        </h4>
                        <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                          "{chat.initialMessage}"
                        </p>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        {chat.assignedAgent && (
                          <div style={{ textAlign: "right" }}>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Claimed By</span>
                            <span style={{ fontSize: "13px", fontWeight: "700", color: "#059669" }}>
                              {chat.assignedAgent.name}
                            </span>
                          </div>
                        )}
                        <button
                          onClick={() => setInspectedChat(chat)}
                          style={{
                            padding: "7px 14px",
                            borderRadius: "6px",
                            backgroundColor: "#ffffff",
                            border: "1px solid var(--border-color)",
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "var(--text-primary)",
                            cursor: "pointer",
                            boxShadow: "var(--shadow-sm)"
                          }}
                        >
                          View Transcript
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: AGENT FLEET MANAGEMENT */}
        {activeTab === "agents" && (
          <div>
            <div className="glass-panel" style={{ padding: "24px", marginBottom: "24px" }}>
              
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                    BPO Support Agent Fleet & Personnel Management
                  </h3>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                    Inspect individual employee performance, monitor active sessions, onboard new staff, or terminate accounts.
                  </p>
                </div>
                <button
                  id="btn-add-agent"
                  onClick={() => setShowAddAgentModal(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 18px",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: "700",
                    boxShadow: "0 4px 14px rgba(124, 58, 237, 0.3)",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  <Plus size={16} />
                  Add Support Employee
                </button>
              </div>

              {/* KPI Metrics row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                <div style={{ padding: "12px 16px", borderRadius: "8px", backgroundColor: "#f8fafc", border: "1px solid var(--border-color)" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Total Staff</span>
                  <div style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>
                    {overviewData.agents.length}
                  </div>
                </div>
                <div style={{ padding: "12px 16px", borderRadius: "8px", backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0" }}>
                  <span style={{ fontSize: "11px", color: "#047857", fontWeight: "600", textTransform: "uppercase" }}>Available (Free)</span>
                  <div style={{ fontSize: "20px", fontWeight: "800", color: "#059669", marginTop: "2px" }}>
                    {overviewData.agents.filter(a => a.status === "available").length}
                  </div>
                </div>
                <div style={{ padding: "12px 16px", borderRadius: "8px", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
                  <span style={{ fontSize: "11px", color: "#1d4ed8", fontWeight: "600", textTransform: "uppercase" }}>In Active Chat</span>
                  <div style={{ fontSize: "20px", fontWeight: "800", color: "#2563eb", marginTop: "2px" }}>
                    {overviewData.agents.filter(a => a.status === "in_chat").length}
                  </div>
                </div>
                <div style={{ padding: "12px 16px", borderRadius: "8px", backgroundColor: "#fffbeb", border: "1px solid #fde68a" }}>
                  <span style={{ fontSize: "11px", color: "#b45309", fontWeight: "600", textTransform: "uppercase" }}>Away / Paused</span>
                  <div style={{ fontSize: "20px", fontWeight: "800", color: "#d97706", marginTop: "2px" }}>
                    {overviewData.agents.filter(a => a.status === "busy").length}
                  </div>
                </div>
                <div style={{ padding: "12px 16px", borderRadius: "8px", backgroundColor: "#fff1f2", border: "1px solid #fecdd3" }}>
                  <span style={{ fontSize: "11px", color: "#be123c", fontWeight: "600", textTransform: "uppercase" }}>Terminated</span>
                  <div style={{ fontSize: "20px", fontWeight: "800", color: "#e11d48", marginTop: "2px" }}>
                    {overviewData.agents.filter(a => a.status === "terminated").length}
                  </div>
                </div>
              </div>

              {/* Filters bar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "20px", padding: "12px 16px", backgroundColor: "#f8fafc", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: "1 1 280px" }}>
                  <Search size={16} color="#64748b" />
                  <input
                    type="text"
                    value={agentSearch}
                    onChange={(e) => setAgentSearch(e.target.value)}
                    placeholder="Search employee by name, email, role, or department..."
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      backgroundColor: "#ffffff"
                    }}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>Dept:</span>
                    <select
                      value={agentDeptFilter}
                      onChange={(e) => setAgentDeptFilter(e.target.value)}
                      style={{ padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", backgroundColor: "#ffffff", fontWeight: "600" }}
                    >
                      <option value="all">All Departments</option>
                      <option value="Technical">Technical</option>
                      <option value="Billing">Billing</option>
                      <option value="General">General</option>
                      <option value="Escalation">Escalation</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>Status:</span>
                    <select
                      value={agentStatusFilter}
                      onChange={(e) => setAgentStatusFilter(e.target.value)}
                      style={{ padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", backgroundColor: "#ffffff", fontWeight: "600" }}
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active Staff (Non-terminated)</option>
                      <option value="available">Available (Free)</option>
                      <option value="in_chat">In Active Chat</option>
                      <option value="busy">Away / Paused</option>
                      <option value="terminated">Terminated Only</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Cards Grid */}
              {filteredAgents.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
                  <p style={{ fontSize: "14px" }}>No support employees match the current filter.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "18px" }}>
                  {filteredAgents.map((ag) => {
                    const agentChatCount = overviewData.chats.filter(c => 
                      c.assignedAgent?.id === ag.id || 
                      c.assignedAgent?.email === ag.email ||
                      c.assignedAgent?.name === ag.name
                    ).length;

                    const isTerminated = ag.status === "terminated";

                    return (
                      <div
                        key={ag.id}
                        style={{
                          padding: "18px",
                          borderRadius: "12px",
                          backgroundColor: isTerminated ? "#fef2f2" : "#ffffff",
                          border: isTerminated ? "1px solid #fecdd3" : "1px solid var(--border-color)",
                          boxShadow: "var(--shadow-sm)",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          gap: "14px",
                          position: "relative",
                          opacity: isTerminated ? 0.9 : 1
                        }}
                      >
                        <div>
                          {/* Agent Header */}
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <div style={{ position: "relative" }}>
                                <img
                                  src={ag.avatar}
                                  alt={ag.name}
                                  style={{
                                    width: "48px",
                                    height: "48px",
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                    border: isTerminated ? "2px solid #f87171" : "2px solid #e2e8f0",
                                    filter: isTerminated ? "grayscale(70%)" : "none"
                                  }}
                                />
                                <span
                                  className={`status-indicator status-${ag.status}`}
                                  style={{
                                    position: "absolute",
                                    bottom: "1px",
                                    right: "1px",
                                    width: "12px",
                                    height: "12px",
                                    border: "2px solid #ffffff"
                                  }}
                                />
                              </div>
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", textDecoration: isTerminated ? "line-through" : "none" }}>
                                    {ag.name}
                                  </h4>
                                </div>
                                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{ag.email}</span>
                                <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginTop: "1px" }}>
                                  Employee ID: {ag.id.substring(ag.id.length - 8)}
                                </span>
                              </div>
                            </div>

                            {/* Status Pill */}
                            <span style={{
                              fontSize: "11px",
                              fontWeight: "700",
                              padding: "3px 9px",
                              borderRadius: "12px",
                              backgroundColor: 
                                isTerminated ? "#fee2e2" :
                                ag.status === "available" ? "#d1fae5" :
                                ag.status === "in_chat" ? "#dbeafe" : "#fef3c7",
                              color:
                                isTerminated ? "#b91c1c" :
                                ag.status === "available" ? "#047857" :
                                ag.status === "in_chat" ? "#1e40af" : "#b45309",
                              border: `1px solid ${
                                isTerminated ? "#fca5a5" :
                                ag.status === "available" ? "#6ee7b7" :
                                ag.status === "in_chat" ? "#93c5fd" : "#fcd34d"
                              }`
                            }}>
                              {isTerminated ? "TERMINATED" : ag.status === "available" ? "Free (Available)" : ag.status === "in_chat" ? "In Chat" : "Away / Paused"}
                            </span>
                          </div>

                          {/* Role & Dept Pills */}
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
                            <span style={{ fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "4px", backgroundColor: "#eff6ff", color: "#1d4ed8" }}>
                              {ag.role}
                            </span>
                            <span style={{ fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "4px", backgroundColor: "#f3e8ff", color: "#7e22ce" }}>
                              {ag.department} Queue
                            </span>
                          </div>

                          {/* Termination Banner if terminated */}
                          {isTerminated && (
                            <div style={{
                              padding: "8px 10px",
                              borderRadius: "6px",
                              backgroundColor: "#fff1f2",
                              border: "1px solid #fecdd3",
                              marginBottom: "10px",
                              fontSize: "11px",
                              color: "#be123c"
                            }}>
                              <strong>Terminated:</strong> {ag.terminationReason || "Administrative decision"}
                              {ag.terminatedAt && (
                                <span style={{ display: "block", color: "#9f1239", fontSize: "10px", marginTop: "2px" }}>
                                  Date: {new Date(ag.terminatedAt).toLocaleString()}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Live Chat Indicator if in_chat */}
                          {ag.status === "in_chat" && ag.activeChatId && (
                            <div style={{
                              padding: "7px 10px",
                              borderRadius: "6px",
                              backgroundColor: "#eff6ff",
                              border: "1px solid #bfdbfe",
                              marginBottom: "10px",
                              fontSize: "11px",
                              color: "#1e40af",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between"
                            }}>
                              <span>Active on chat: <strong>#{ag.activeChatId.substring(0, 15)}...</strong></span>
                            </div>
                          )}

                          {/* Metrics stats row */}
                          <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "12px",
                            padding: "8px 10px",
                            borderRadius: "6px",
                            backgroundColor: "#f8fafc",
                            border: "1px solid #e2e8f0"
                          }}>
                            <span>Total Chats: <strong style={{ color: "#0f172a" }}>{agentChatCount || ag.stats?.resolvedToday || 0}</strong></span>
                            <span style={{ color: "#d97706", fontWeight: "700" }}>★ {ag.stats?.avgRating || "5.0"} CSAT</span>
                            <span>Status: <strong style={{ color: isTerminated ? "#e11d48" : "#059669" }}>{isTerminated ? "Inactive" : "Authorized"}</strong></span>
                          </div>
                        </div>

                        {/* Action buttons footer */}
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "8px",
                          paddingTop: "12px",
                          borderTop: "1px solid #e2e8f0",
                          flexWrap: "wrap"
                        }}>
                          {/* VIEW CHATS BUTTON */}
                          <button
                            id={`btn-view-chats-${ag.email.replace(/[@.]/g, '-')}`}
                            onClick={() => handleInspectAgentChats(ag)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "12px",
                              fontWeight: "700",
                              padding: "6px 12px",
                              borderRadius: "6px",
                              background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                              color: "#ffffff",
                              border: "none",
                              cursor: "pointer",
                              boxShadow: "0 2px 8px rgba(124, 58, 237, 0.25)"
                            }}
                          >
                            <MessageSquare size={13} />
                            View Chats ({agentChatCount})
                          </button>

                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {!isTerminated ? (
                              <>
                                <button
                                  onClick={() => handleToggleAgentStatus(ag.id, ag.status)}
                                  disabled={ag.status === "in_chat"}
                                  title="Toggle between Free (Available) and Away"
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: "600",
                                    padding: "5px 10px",
                                    borderRadius: "6px",
                                    backgroundColor: "#ffffff",
                                    border: "1px solid #cbd5e1",
                                    color: "var(--text-primary)",
                                    cursor: ag.status === "in_chat" ? "not-allowed" : "pointer"
                                  }}
                                >
                                  {ag.status === "available" ? "Set Away" : "Set Free"}
                                </button>

                                <button
                                  id={`btn-terminate-${ag.email.replace(/[@.]/g, '-')}`}
                                  onClick={() => handleOpenTerminate(ag)}
                                  title="Terminate Employee Access"
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    padding: "5px 10px",
                                    borderRadius: "6px",
                                    backgroundColor: "#fff1f2",
                                    border: "1px solid #fecdd3",
                                    color: "#e11d48",
                                    cursor: "pointer"
                                  }}
                                >
                                  <UserX size={13} />
                                  Terminate
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  id={`btn-reactivate-${ag.email.replace(/[@.]/g, '-')}`}
                                  onClick={() => handleReactivateAgent(ag.id)}
                                  title="Reactivate Employee"
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    padding: "5px 10px",
                                    borderRadius: "6px",
                                    backgroundColor: "#ecfdf5",
                                    border: "1px solid #a7f3d0",
                                    color: "#059669",
                                    cursor: "pointer"
                                  }}
                                >
                                  <UserCheck size={13} />
                                  Re-activate
                                </button>

                                <button
                                  onClick={() => handleDeleteAgent(ag.id)}
                                  title="Permanently Delete Record"
                                  style={{
                                    padding: "5px 8px",
                                    borderRadius: "6px",
                                    backgroundColor: "#ffffff",
                                    border: "1px solid #cbd5e1",
                                    color: "#64748b",
                                    cursor: "pointer"
                                  }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: TICKET ARCHIVE & AUDIT */}
        {activeTab === "archive" && (
          <div>
            <div className="glass-panel" style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                    MongoDB Ticket Archive & Feedback Audit Logs
                  </h3>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                    All chat dialogues, ratings, timestamps, and internal notes safely persisted in Atlas.
                  </p>
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <div style={{ position: "relative", minWidth: "260px" }}>
                    <Search size={15} color="#94a3b8" style={{ position: "absolute", left: "10px", top: "11px" }} />
                    <input
                      type="text"
                      value={archiveSearch}
                      onChange={(e) => setArchiveSearch(e.target.value)}
                      placeholder="Search subject, customer or email..."
                      style={{
                        width: "100%",
                        padding: "8px 12px 8px 32px",
                        borderRadius: "8px",
                        backgroundColor: "#f8fafc",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                        color: "#0f172a"
                      }}
                    />
                  </div>

                  <select
                    value={archiveDeptFilter}
                    onChange={(e) => setArchiveDeptFilter(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      color: "#0f172a",
                      cursor: "pointer"
                    }}
                  >
                    <option value="all">All Departments</option>
                    <option value="Technical">Technical</option>
                    <option value="Billing">Billing</option>
                    <option value="General">General</option>
                    <option value="Escalation">Escalation</option>
                  </select>
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--border-color)", color: "var(--text-secondary)" }}>
                      <th style={{ padding: "12px 14px" }}>Ticket ID</th>
                      <th style={{ padding: "12px 14px" }}>Customer</th>
                      <th style={{ padding: "12px 14px" }}>Department</th>
                      <th style={{ padding: "12px 14px" }}>Subject</th>
                      <th style={{ padding: "12px 14px" }}>Assigned Agent</th>
                      <th style={{ padding: "12px 14px" }}>Status</th>
                      <th style={{ padding: "12px 14px" }}>Rating</th>
                      <th style={{ padding: "12px 14px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredChats.map((c) => (
                      <tr
                        key={c.id}
                        style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#ffffff" }}
                      >
                        <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                          #{c.id.substring(c.id.length - 8)}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <strong style={{ color: "#0f172a", display: "block" }}>{c.customer?.name}</strong>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{c.customer?.email}</span>
                          {c.customer?.phone && (
                            <span style={{ fontSize: "11px", color: "#0284c7", display: "block", fontWeight: "600" }}>📞 {c.customer.phone}</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "4px", backgroundColor: "#f1f5f9", color: "#334155" }}>
                            {c.customer?.department}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", maxWidth: "260px" }}>
                          <span style={{ color: "#0f172a", fontWeight: "600", display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                            {c.subject}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          {c.assignedAgent ? (
                            <span style={{ color: "#059669", fontWeight: "600" }}>{c.assignedAgent.name}</span>
                          ) : (
                            <span style={{ color: "var(--text-muted)" }}>Unassigned</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{
                            fontSize: "11px",
                            fontWeight: "700",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            backgroundColor: c.status === "resolved" ? "#ecfdf5" : c.status === "active" ? "#eff6ff" : "#fffbeb",
                            color: c.status === "resolved" ? "#059669" : c.status === "active" ? "#2563eb" : "#d97706"
                          }}>
                            {c.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          {c.rating ? (
                            <span style={{ color: "#d97706", fontWeight: "700" }}>
                              {"★".repeat(c.rating)} ({c.rating}/5)
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <button
                            onClick={() => setInspectedChat(c)}
                            style={{
                              padding: "5px 10px",
                              borderRadius: "6px",
                              backgroundColor: "#f1f5f9",
                              border: "1px solid var(--border-color)",
                              fontSize: "12px",
                              fontWeight: "600",
                              color: "var(--accent-blue)",
                              cursor: "pointer"
                            }}
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CANNED MACROS */}
        {activeTab === "canned" && (
          <div>
            <div className="glass-panel" style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                    Shared Agent Canned Responses & Quick Macros
                  </h3>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                    Standardize BPO reply templates accessible to all free support representatives.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddCannedModal(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "9px 18px",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: "700",
                    boxShadow: "0 4px 14px rgba(124, 58, 237, 0.3)"
                  }}
                >
                  <Plus size={16} />
                  New Canned Macro
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
                {overviewData.cannedResponses.map((macro) => (
                  <div
                    key={macro.id}
                    style={{
                      padding: "16px",
                      borderRadius: "10px",
                      backgroundColor: "#f8fafc",
                      border: "1px solid var(--border-color)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "10px"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>
                          {macro.title}
                        </span>
                        <button
                          onClick={() => handleDeleteCanned(macro.id)}
                          style={{
                            padding: "4px",
                            borderRadius: "4px",
                            backgroundColor: "transparent",
                            border: "none",
                            color: "#94a3b8",
                            cursor: "pointer"
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                        "{macro.text}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* MODAL 1: ADD SUPPORT EMPLOYEE */}
      {showAddAgentModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.45)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "480px", padding: "28px", backgroundColor: "#ffffff" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>Onboard Support Employee</h3>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                  Creates a dedicated agent profile in MongoDB with authorized /support access.
                </p>
              </div>
              <button onClick={() => setShowAddAgentModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateAgent} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Full Name *</label>
                <input
                  type="text"
                  required
                  value={newAgentForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoEmail = name ? `${name.toLowerCase().replace(/\s+/g, ".")}@support.bpo` : "";
                    setNewAgentForm({ ...newAgentForm, name, email: newAgentForm.email ? newAgentForm.email : autoEmail });
                  }}
                  placeholder="e.g. Elena Rostova"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Work Email *</label>
                <input
                  type="email"
                  required
                  value={newAgentForm.email}
                  onChange={(e) => setNewAgentForm({ ...newAgentForm, email: e.target.value })}
                  placeholder="elena.rostova@support.bpo"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#334155" }}>Initial Password *</label>
                  <span style={{ fontSize: "11px", color: "#7c3aed", fontWeight: "600" }}>Default: bpo123</span>
                </div>
                <input
                  type="text"
                  required
                  value={newAgentForm.password}
                  onChange={(e) => setNewAgentForm({ ...newAgentForm, password: e.target.value })}
                  placeholder="bpo123"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Role Designation</label>
                <input
                  type="text"
                  value={newAgentForm.role}
                  onChange={(e) => setNewAgentForm({ ...newAgentForm, role: e.target.value })}
                  placeholder="e.g. Senior Technical Specialist"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Assigned Department Queue</label>
                <select
                  value={newAgentForm.department}
                  onChange={(e) => setNewAgentForm({ ...newAgentForm, department: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", cursor: "pointer", backgroundColor: "#ffffff" }}
                >
                  <option value="Technical">Technical Support</option>
                  <option value="Billing">Billing & Accounts</option>
                  <option value="General">General Inquiry</option>
                  <option value="Escalation">Priority Escalation</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Avatar Preset</label>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  {[
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
                    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
                  ].map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt="Preset"
                      onClick={() => setNewAgentForm({ ...newAgentForm, avatar: url })}
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        cursor: "pointer",
                        border: newAgentForm.avatar === url ? "3px solid #7c3aed" : "2px solid #e2e8f0"
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddAgentModal(false)}
                  style={{ padding: "8px 16px", borderRadius: "8px", backgroundColor: "#f1f5f9", border: "1px solid var(--border-color)", fontSize: "13px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 20px",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: "pointer",
                    border: "none",
                    boxShadow: "0 2px 8px rgba(124, 58, 237, 0.3)"
                  }}
                >
                  Create & Authorize Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TERMINATE EMPLOYEE CONFIRMATION */}
      {terminatingAgent && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.55)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "460px", padding: "28px", backgroundColor: "#ffffff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <UserX size={22} color="#dc2626" />
              </div>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>Terminate Support Employee</h3>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Revoke access & deactivate account</span>
              </div>
            </div>

            <div style={{ padding: "12px", borderRadius: "8px", backgroundColor: "#fff1f2", border: "1px solid #fecdd3", marginBottom: "16px", fontSize: "12px", color: "#9f1239" }}>
              <strong>Caution:</strong> This will immediately disconnect the employee's live socket session on <code>/support</code>, block future sign-ins, and mark their record as Terminated.
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "8px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
              <img src={terminatingAgent.avatar} alt={terminatingAgent.name} style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
              <div>
                <strong style={{ fontSize: "14px", color: "#0f172a", display: "block" }}>{terminatingAgent.name}</strong>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{terminatingAgent.email} • {terminatingAgent.department}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmTerminate} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                  Termination Reason
                </label>
                <input
                  type="text"
                  required
                  value={terminationReason}
                  onChange={(e) => setTerminationReason(e.target.value)}
                  placeholder="e.g. End of contract, Performance, Administrative leave"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setTerminatingAgent(null)}
                  style={{ padding: "8px 16px", borderRadius: "8px", backgroundColor: "#f1f5f9", border: "1px solid var(--border-color)", fontSize: "13px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-terminate"
                  type="submit"
                  style={{
                    padding: "8px 18px",
                    borderRadius: "8px",
                    backgroundColor: "#dc2626",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: "pointer",
                    border: "none",
                    boxShadow: "0 2px 8px rgba(220, 38, 38, 0.3)"
                  }}
                >
                  Confirm Termination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EMPLOYEE CHAT HISTORY & PORTFOLIO */}
      {selectedAgentForChats && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.5)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "860px", maxHeight: "90vh", display: "flex", flexDirection: "column", backgroundColor: "#ffffff", overflow: "hidden" }}>
            
            {/* Modal Header */}
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border-color)", backgroundColor: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <img
                  src={selectedAgentForChats.avatar}
                  alt={selectedAgentForChats.name}
                  style={{ width: "46px", height: "46px", borderRadius: "50%", objectFit: "cover", border: "2px solid #e2e8f0" }}
                />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a" }}>
                      Chats Handled by {selectedAgentForChats.name}
                    </h3>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      backgroundColor: selectedAgentForChats.status === "available" ? "#d1fae5" : selectedAgentForChats.status === "in_chat" ? "#dbeafe" : selectedAgentForChats.status === "terminated" ? "#fee2e2" : "#fef3c7",
                      color: selectedAgentForChats.status === "available" ? "#047857" : selectedAgentForChats.status === "in_chat" ? "#1e40af" : selectedAgentForChats.status === "terminated" ? "#b91c1c" : "#b45309"
                    }}>
                      {selectedAgentForChats.status.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    {selectedAgentForChats.email} • {selectedAgentForChats.role} ({selectedAgentForChats.department} Dept)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAgentForChats(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--border-color)", backgroundColor: "#ffffff", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: "1 1 240px" }}>
                <Search size={15} color="#64748b" />
                <input
                  type="text"
                  value={agentChatsSearch}
                  onChange={(e) => setAgentChatsSearch(e.target.value)}
                  placeholder="Filter customer name, email, query, or ticket ID..."
                  style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "6px" }}>
                {["all", "active", "resolved"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setAgentChatsFilter(tab)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: agentChatsFilter === tab ? "700" : "500",
                      backgroundColor: agentChatsFilter === tab ? "#7c3aed" : "#f1f5f9",
                      color: agentChatsFilter === tab ? "#ffffff" : "var(--text-secondary)",
                      border: "none",
                      cursor: "pointer"
                    }}
                  >
                    {tab === "all" ? `All (${agentChatsList.length})` : tab === "active" ? `Active (${agentChatsList.filter(c => c.status === "active").length})` : `Resolved (${agentChatsList.filter(c => c.status === "resolved").length})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat list */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {filteredAgentChats.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
                  <MessageSquare size={32} style={{ margin: "0 auto 10px auto", color: "#cbd5e1" }} />
                  <p style={{ fontSize: "14px", fontWeight: "600", color: "#64748b" }}>No chat records found for this employee</p>
                  <span style={{ fontSize: "12px" }}>Chats handled or currently active will appear here automatically.</span>
                </div>
              ) : (
                filteredAgentChats.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: "14px 18px",
                      borderRadius: "10px",
                      backgroundColor: "#f8fafc",
                      border: "1px solid var(--border-color)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "12px"
                    }}
                  >
                    <div style={{ flex: "1 1 360px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{
                          fontSize: "10px",
                          fontWeight: "800",
                          textTransform: "uppercase",
                          padding: "2px 7px",
                          borderRadius: "4px",
                          backgroundColor: c.status === "active" ? "#2563eb" : "#059669",
                          color: "#ffffff"
                        }}>
                          {c.status.toUpperCase()}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>#{c.id}</span>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>•</span>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          {c.createdAt ? new Date(c.createdAt).toLocaleString() : "Recent"}
                        </span>
                      </div>

                      <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>
                        {c.subject}
                      </h4>
                      <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                        Customer: <strong>{c.customer?.name}</strong> ({c.customer?.email})
                        {c.customer?.phone && <span style={{ color: "#0284c7", fontWeight: "600" }}> • 📞 {c.customer.phone}</span>}
                      </p>
                      <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", fontStyle: "italic" }}>
                        "{c.initialMessage}"
                      </p>

                      {c.summary && (
                        <div style={{ marginTop: "6px", fontSize: "11px", color: "#059669" }}>
                          <strong>Resolution:</strong> {c.summary}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {c.rating && (
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#d97706" }}>
                          ★ {c.rating}/5
                        </span>
                      )}

                      <span style={{ fontSize: "11px", color: "var(--text-muted)", backgroundColor: "#ffffff", padding: "4px 8px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                        {c.messages?.length || 0} msgs
                      </span>

                      <button
                        onClick={() => setInspectedChat(c)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "7px 12px",
                          borderRadius: "6px",
                          backgroundColor: "#ffffff",
                          border: "1px solid #cbd5e1",
                          fontSize: "12px",
                          fontWeight: "700",
                          color: "#7c3aed",
                          cursor: "pointer",
                          boxShadow: "var(--shadow-sm)"
                        }}
                      >
                        <Eye size={13} />
                        Inspect Dialogue
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: "12px 24px", borderTop: "1px solid var(--border-color)", backgroundColor: "#f8fafc", textAlign: "right" }}>
              <button
                id="btn-close-agent-chats"
                onClick={() => setSelectedAgentForChats(null)}
                style={{ padding: "7px 16px", borderRadius: "6px", backgroundColor: "#ffffff", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: ADD CANNED MACRO */}
      {showAddCannedModal && (
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
          <div className="glass-panel" style={{ width: "100%", maxWidth: "460px", padding: "28px", backgroundColor: "#ffffff" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>Create Shared Canned Macro</h3>
              <button onClick={() => setShowAddCannedModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateCanned} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Macro Title / Label</label>
                <input
                  type="text"
                  required
                  value={newCannedForm.title}
                  onChange={(e) => setNewCannedForm({ ...newCannedForm, title: e.target.value })}
                  placeholder="e.g. Request Screenshot"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Message Text</label>
                <textarea
                  rows={3}
                  required
                  value={newCannedForm.text}
                  onChange={(e) => setNewCannedForm({ ...newCannedForm, text: e.target.value })}
                  placeholder="Full message that gets inserted into chat..."
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button type="button" onClick={() => setShowAddCannedModal(false)} style={{ padding: "8px 16px", borderRadius: "8px", backgroundColor: "#f1f5f9", border: "1px solid var(--border-color)", fontSize: "13px" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 18px", borderRadius: "8px", backgroundColor: "#7c3aed", color: "#ffffff", fontSize: "13px", fontWeight: "700" }}>Save Macro</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TICKET INSPECTOR & TRANSCRIPT */}
      {inspectedChat && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.45)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "680px", maxHeight: "85vh", display: "flex", flexDirection: "column", backgroundColor: "#ffffff", overflow: "hidden" }}>
            
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border-color)", backgroundColor: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
                    Ticket #{inspectedChat.id}
                  </h3>
                  <span style={{ fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "10px", backgroundColor: "#eff6ff", color: "#1d4ed8" }}>
                    {inspectedChat.customer?.department}
                  </span>
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  Customer: <strong>{inspectedChat.customer?.name}</strong> ({inspectedChat.customer?.email}{inspectedChat.customer?.phone ? ` • 📞 ${inspectedChat.customer.phone}` : ""}) • Agent: <strong>{inspectedChat.assignedAgent?.name || "Unassigned"}</strong>
                </p>
              </div>
              <button onClick={() => setInspectedChat(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={20} /></button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              
              <div style={{ padding: "12px 16px", borderRadius: "8px", backgroundColor: "#f8fafc", border: "1px solid var(--border-color)", fontSize: "13px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Subject</span>
                <strong style={{ color: "#0f172a" }}>{inspectedChat.subject}</strong>
                {inspectedChat.summary && (
                  <div style={{ marginTop: "6px" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Resolution Summary</span>
                    <p style={{ color: "#059669", fontWeight: "600" }}>{inspectedChat.summary}</p>
                  </div>
                )}
              </div>

              <div>
                <h4 style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "8px" }}>
                  Full Dialogue Transcript (Stored in MongoDB)
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "12px", borderRadius: "8px", backgroundColor: "#f8fafc", border: "1px solid var(--border-color)", maxHeight: "260px", overflowY: "auto" }}>
                  {inspectedChat.messages?.map((m, idx) => (
                    <div key={idx} style={{ fontSize: "12px" }}>
                      <strong style={{ color: m.sender === "customer" ? "#2563eb" : m.sender === "agent" ? "#059669" : "#64748b" }}>
                        {m.senderName}:
                      </strong>{" "}
                      <span style={{ color: "#0f172a" }}>{m.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {inspectedChat.notes?.length > 0 && (
                <div>
                  <h4 style={{ fontSize: "13px", fontWeight: "700", color: "#d97706", marginBottom: "6px" }}>
                    Internal Agent Case Notes
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {inspectedChat.notes.map((n, idx) => (
                      <div key={idx} style={{ padding: "8px 10px", borderRadius: "6px", backgroundColor: "#fffbeb", border: "1px solid #fef08a", fontSize: "12px" }}>
                        <span style={{ fontWeight: "700", color: "#92400e" }}>{n.author}:</span> {n.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border-color)", backgroundColor: "#f8fafc", textAlign: "right" }}>
              <button
                onClick={() => setInspectedChat(null)}
                style={{ padding: "7px 18px", borderRadius: "6px", backgroundColor: "#ffffff", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
              >
                Close Inspector
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{
        padding: "16px 24px",
        textAlign: "center",
        fontSize: "12px",
        color: "var(--text-muted)",
        borderTop: "1px solid var(--border-color)",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        marginTop: "auto"
      }}>
        <span>BPO Operations & Administration Suite • MongoDB Atlas Real-Time Synchronized</span>
      </footer>

    </div>
  );
}
