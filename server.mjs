import { createServer } from "node:http";
import fs from "node:fs";
import next from "next";
import { Server } from "socket.io";
import bcrypt from "bcryptjs";
import { initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { connectDB } from "./lib/db.js";
import { initDatabase } from "./lib/seed.js";
import User from "./models/User.js";
import Chat from "./models/Chat.js";
import CannedMacro from "./models/CannedMacro.js";

// ── Firebase Admin FCM Push Notification Service ──────────
let firebaseMessaging = null;
try {
  const serviceAccountPath = "./firebase-service-account.json";
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
    const fbApp = initializeApp({
      credential: cert(serviceAccount)
    });
    firebaseMessaging = getMessaging(fbApp);
    console.log("> [Firebase] FCM Push Notifications initialized successfully.");
  } else {
    console.log("> [Firebase] firebase-service-account.json not found; push notifications disabled.");
  }
} catch (err) {
  console.error("> [Firebase] Push initialization error:", err.message);
}

async function sendAgentPushNotification(fcmToken, { title, body, chatId }) {
  if (!firebaseMessaging || !fcmToken) return;
  try {
    const message = {
      token: fcmToken,
      notification: {
        title,
        body
      },
      data: {
        chatId: String(chatId || ""),
        title: String(title || ""),
        body: String(body || ""),
        click_action: "FLUTTER_NOTIFICATION_CLICK"
      },
      android: {
        priority: "high",
        ttl: 3600 * 1000, // 1 hour TTL: instant direct delivery
        notification: {
          channelId: "omniflow_incoming",
          sound: "default",
          priority: "max",
          defaultSound: true,
          defaultVibrateTimings: true,
          visibility: "public",
          tag: chatId ? String(chatId) : undefined
        }
      }
    };
    const response = await firebaseMessaging.send(message);
    console.log(`> [FCM] High-priority push sent to token ${fcmToken.slice(0, 10)}... (ID: ${response})`);
  } catch (err) {
    console.error(`> [FCM] Push send error:`, err.message);
  }
}

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "3001", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Live runtime agent presence state
// Keyed by agent ID or email -> agent object with live socketId
const liveAgents = {};

// Active in-memory chats map for zero-latency messaging
const liveChats = {};

function getAvailableAgents() {
  return Object.values(liveAgents).filter(a => a.status === "available" && a.socketId);
}

function broadcastAgentList(io) {
  io.emit("agents_update", Object.values(liveAgents));
}

function getSystemMetrics() {
  const allChats = Object.values(liveChats);
  return {
    waitingChats: allChats.filter(c => c.status === "waiting").length,
    activeChats: allChats.filter(c => c.status === "active").length,
    resolvedChats: allChats.filter(c => c.status === "resolved").length,
    totalAgents: Object.keys(liveAgents).length,
    availableAgents: getAvailableAgents().length,
    busyAgents: Object.values(liveAgents).filter(a => a.status === "in_chat" || a.status === "busy").length
  };
}

function broadcastMetrics(io) {
  io.emit("metrics_update", getSystemMetrics());
}

app.prepare().then(async () => {
  // Connect to MongoDB Atlas
  try {
    await connectDB();
    await initDatabase();

    // Load agents from MongoDB into liveAgents map
    const dbAgents = await User.find({ role: "agent" });
    dbAgents.forEach((ag) => {
      const id = ag._id.toString();
      liveAgents[id] = {
        id,
        email: ag.email,
        name: ag.name,
        role: ag.designation || ag.role,
        department: ag.department || "General",
        avatar: ag.avatar,
        status: ag.status || "available",
        fcmToken: ag.fcmToken || null,
        terminatedAt: ag.terminatedAt ? ag.terminatedAt.toISOString() : null,
        terminationReason: ag.terminationReason || null,
        socketId: null,
        activeChatId: null,
        stats: ag.stats || { resolvedToday: 0, avgRating: 5.0 },
        createdAt: ag.createdAt ? ag.createdAt.toISOString() : null
      };
    });

    // Load recent chats into liveChats map
    const dbChats = await Chat.find().sort({ createdAt: -1 }).limit(100);
    dbChats.forEach((c) => {
      liveChats[c.chatId] = {
        id: c.chatId,
        customer: c.customer,
        subject: c.subject,
        initialMessage: c.initialMessage,
        status: c.status,
        customerConnected: c.customerConnected !== false,
        customerDisconnectedAt: c.customerDisconnectedAt ? c.customerDisconnectedAt.toISOString() : null,
        assignedAgent: c.assignedAgent,
        messages: c.messages || [],
        notes: c.notes || [],
        summary: c.summary,
        rating: c.rating,
        createdAt: c.createdAt ? c.createdAt.toISOString() : new Date().toISOString(),
        acceptedAt: c.acceptedAt ? c.acceptedAt.toISOString() : null,
        resolvedAt: c.resolvedAt ? c.resolvedAt.toISOString() : null,
      };
    });

    console.log(`> [MongoDB] Loaded ${Object.keys(liveAgents).length} agents and ${Object.keys(liveChats).length} chats from Atlas.`);
  } catch (err) {
    console.error("> [MongoDB] Startup initialization error:", err);
  }

  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["ngrok-skip-browser-warning", "Content-Type", "Authorization"]
    }
  });

  io.on("connection", (socket) => {
    socket.emit("agents_update", Object.values(liveAgents));
    socket.emit("metrics_update", getSystemMetrics());

    CannedMacro.find().then(macros => {
      socket.emit("canned_responses_update", macros.map(c => ({ id: c._id.toString(), title: c.title, text: c.text })));
    }).catch(() => {});

    socket.on("get_canned_macros", async () => {
      try {
        const macros = await CannedMacro.find();
        socket.emit("canned_responses_update", macros.map(c => ({ id: c._id.toString(), title: c.title, text: c.text })));
      } catch (e) {
        console.error("Error fetching canned macros:", e.message);
      }
    });

    socket.on("agent_get_history", async ({ agentId }) => {
      try {
        const history = await Chat.find({
          status: "resolved",
          $or: [
            { "assignedAgent.id": agentId },
            { "assignedAgent.email": agentId }
          ]
        }).sort({ resolvedAt: -1, createdAt: -1 }).limit(50);

        socket.emit("agent_history_data", {
          agentId,
          chats: history.map(c => ({
            id: c.chatId || c.id,
            customer: c.customer,
            subject: c.subject,
            initialMessage: c.initialMessage,
            status: c.status,
            assignedAgent: c.assignedAgent,
            messages: c.messages,
            notes: c.notes,
            summary: c.summary,
            rating: c.rating,
            createdAt: c.createdAt ? c.createdAt.toISOString() : null,
            acceptedAt: c.acceptedAt ? c.acceptedAt.toISOString() : null,
            resolvedAt: c.resolvedAt ? c.resolvedAt.toISOString() : null,
          }))
        });
      } catch (e) {
        console.error("Error fetching agent history:", e.message);
      }
    });

    // ------------------------------------
    // AGENT REGISTRATION & PRESENCE
    // ------------------------------------
    socket.on("agent_register", async ({ agentId, status }) => {
      let agent = liveAgents[agentId];
      if (!agent) {
        // Try to find by email or ID in liveAgents
        agent = Object.values(liveAgents).find(a => a.id === agentId || a.email === agentId);
      }

      if (agent) {
        console.log(`> [Socket] Agent registered: ${agent.name} (${agent.id}) on socket ${socket.id}`);
        if (agent.status === "terminated") {
          socket.emit("agent_session_terminated", {
            reason: agent.terminationReason || "Your account has been deactivated by administration."
          });
          return;
        }

        agent.socketId = socket.id;
        if (agent.activeChatId && (!liveChats[agent.activeChatId] || liveChats[agent.activeChatId].status !== "active")) {
          agent.activeChatId = null;
        }
        if (agent.activeChatId && liveChats[agent.activeChatId]?.status === "active") {
          agent.status = "in_chat";
        } else if (status) {
          agent.status = status;
        } else {
          agent.status = agent.status || "available";
        }
        socket.join("agents_room");
        socket.join(`agent_${agent.id}`);
        socket.emit("agent_registered", { agent });
        broadcastAgentList(io);
        broadcastMetrics(io);

        try {
          await User.updateOne({ _id: agent.id }, { status: agent.status });
        } catch (e) {}

        // If agent already has an active ongoing chat, restore it to client
        let activeChatForAgent = null;
        if (agent.activeChatId && liveChats[agent.activeChatId]?.status === "active") {
          activeChatForAgent = liveChats[agent.activeChatId];
        } else {
          activeChatForAgent = Object.values(liveChats).find(
            c => c.status === "active" && c.assignedAgent?.id === agent.id
          );
        }

        if (activeChatForAgent) {
          const cId = activeChatForAgent.chatId || activeChatForAgent.id;
          agent.activeChatId = cId;
          agent.status = "in_chat";
          socket.join(`chat_${cId}`);
          socket.emit("chat_accept_success", { chat: activeChatForAgent });
          console.log(`> [Socket] Auto-restored active chat ${cId} for agent ${agent.name}`);
        }

        // Send any pending waiting broadcasts
        const waitingList = Object.values(liveChats).filter(c => c.status === "waiting");
        waitingList.forEach(chat => {
          socket.emit("incoming_chat_broadcast", chat);
        });
      }
    });

    socket.on("agent_update_status", async ({ agentId, status }) => {
      const agent = liveAgents[agentId] || Object.values(liveAgents).find(a => a.id === agentId);
      if (agent) {
        if (agent.activeChatId && status !== "in_chat") {
          socket.emit("error_msg", { message: "Cannot change status while in an active chat session." });
          return;
        }
        agent.status = status;
        socket.emit("agent_status_updated", { agent });
        broadcastAgentList(io);
        broadcastMetrics(io);

        // Persist status in MongoDB
        try {
          await User.updateOne({ _id: agent.id }, { status });
        } catch (e) {
          console.error("DB status update error:", e.message);
        }

        if (status === "available") {
          const waitingList = Object.values(liveChats).filter(c => c.status === "waiting");
          waitingList.forEach(chat => {
            socket.emit("incoming_chat_broadcast", chat);
          });
        }
      }
    });

    // ------------------------------------
    // AGENT REGISTERS FCM TOKEN (MOBILE APP)
    // ------------------------------------
    socket.on("agent_register_fcm_token", async ({ agentId, fcmToken }) => {
      try {
        const agent = liveAgents[agentId] || Object.values(liveAgents).find(a => a.id === agentId);
        if (agent) {
          agent.fcmToken = fcmToken;
        }
        await User.updateOne({ _id: agentId }, { fcmToken });
        console.log(`> [FCM] Registered mobile push token for agent: ${agentId}`);
      } catch (err) {
        console.error("> [FCM] Error saving token:", err.message);
      }
    });

    // ------------------------------------
    // CUSTOMER INITIATES CHAT REQUEST
    // ------------------------------------
    socket.on("customer_request_chat", async ({ customerName, customerEmail, customerPhone, phone, department, subject, initialMessage }) => {
      const chatId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const customerId = socket.id;

      const newChat = {
        id: chatId,
        chatId: chatId,
        customerConnected: true,
        customerSocketId: socket.id,
        customer: {
          id: customerId,
          name: customerName || "Customer",
          email: customerEmail || "guest@user.com",
          phone: phone || customerPhone || null,
          department: department || "General",
        },
        subject: subject || "Customer Inquiry",
        initialMessage: initialMessage || "Hello, I need assistance.",
        status: "waiting",
        assignedAgent: null,
        messages: [
          {
            id: `msg_${Date.now()}`,
            sender: "customer",
            senderName: customerName || "Customer",
            text: initialMessage || "Hello, I need assistance.",
            timestamp: new Date().toISOString()
          }
        ],
        notes: [],
        createdAt: new Date().toISOString(),
        acceptedAt: null,
        resolvedAt: null
      };

      liveChats[chatId] = newChat;

      // Persist in MongoDB
      try {
        await Chat.create({
          chatId,
          customer: newChat.customer,
          subject: newChat.subject,
          initialMessage: newChat.initialMessage,
          status: "waiting",
          customerConnected: true,
          messages: newChat.messages,
          notes: [],
          createdAt: new Date()
        });
        console.log(`> [MongoDB] Saved new customer chat inquiry: ${chatId}`);
      } catch (e) {
        console.error("Error saving chat to Mongo:", e.message);
      }

      socket.join(`chat_${chatId}`);
      socket.emit("chat_queued", {
        chat: newChat,
        availableAgentsCount: getAvailableAgents().length
      });

      // Broadcast to ALL agents who are currently AVAILABLE (free)
      const freeAgents = getAvailableAgents();
      freeAgents.forEach(freeAgent => {
        if (freeAgent.socketId) {
          io.to(freeAgent.socketId).emit("incoming_chat_broadcast", newChat);
        }
      });
      // Also broadcast to agents_room room to ensure all active agent sockets receive the ticket
      io.to("agents_room").emit("incoming_chat_broadcast", newChat);
      console.log(`> [Socket] Broadcasted new customer inquiry ${chatId} to ${freeAgents.length} free agents and agents_room`);

      // ── Push Notification via FCM to all registered mobile agents ──
      try {
        const dbAgents = await User.find({
          role: "agent",
          fcmToken: { $exists: true, $ne: null },
          status: { $ne: "terminated" }
        });
        const tokens = new Set();
        dbAgents.forEach(ag => {
          if (ag.status !== "break" && ag.fcmToken) {
            tokens.add(ag.fcmToken);
          }
        });
        Object.values(liveAgents).forEach(ag => {
          if (ag.status !== "terminated" && ag.status !== "break" && ag.fcmToken) {
            tokens.add(ag.fcmToken);
          }
        });

        console.log(`> [Push] Sending incoming chat notification for ${chatId} to ${tokens.size} agent device(s)`);
        tokens.forEach(token => {
          sendAgentPushNotification(token, {
            title: `🔔 New Support Chat: ${newChat.customer.name}`,
            body: `${newChat.subject || "Customer Inquiry"} - "${(newChat.initialMessage || "").slice(0, 80)}"`,
            chatId: chatId
          });
        });
      } catch (pushErr) {
        console.error("> [Push Error]:", pushErr.message);
      }

      broadcastMetrics(io);
    });

    // ------------------------------------
    // AGENT ACCEPTS CHAT (FIRST TO ACCEPT WINS)
    // ------------------------------------
    socket.on("agent_accept_chat", async ({ agentId, chatId }) => {
      const chat = liveChats[chatId];
      const agent = liveAgents[agentId] || Object.values(liveAgents).find(a => a.id === agentId);

      if (!chat) {
        socket.emit("chat_accept_failed", { chatId, reason: "Chat request no longer exists." });
        return;
      }

      if (!agent || agent.status === "terminated") {
        socket.emit("chat_accept_failed", { chatId, reason: "Agent is not authorized or has been terminated." });
        return;
      }

      // Check if already taken (RACE CONDITION CHECK)
      if (chat.status !== "waiting") {
        const takerName = chat.assignedAgent ? chat.assignedAgent.name : "another agent";
        socket.emit("chat_accept_failed", {
          chatId,
          reason: `Chat has already been accepted by ${takerName}.`
        });
        return;
      }

      // ATOMIC CLAIM: First agent claims it
      chat.status = "active";
      chat.assignedAgent = {
        id: agent.id,
        name: agent.name,
        role: agent.role,
        department: agent.department,
        avatar: agent.avatar
      };
      chat.acceptedAt = new Date().toISOString();

      const sysMsg = {
        id: `msg_sys_${Date.now()}`,
        sender: "system",
        senderName: "BPO Dispatch",
        text: `${agent.name} (${agent.role}) has joined the conversation.`,
        timestamp: new Date().toISOString()
      };
      chat.messages.push(sysMsg);

      agent.status = "in_chat";
      agent.activeChatId = chatId;

      // Update in MongoDB safely
      try {
        await Chat.updateOne(
          { chatId },
          {
            status: "active",
            assignedAgent: chat.assignedAgent,
            acceptedAt: new Date(),
            $push: { messages: sysMsg }
          }
        );
        await User.updateOne({ _id: agent.id }, { status: "in_chat", activeChatId: chatId });
        console.log(`> [MongoDB] Chat ${chatId} claimed by agent ${agent.name}`);
      } catch (e) {
        console.error("DB claim error:", e.message);
      }

      socket.join(`chat_${chatId}`);
      socket.emit("chat_accept_success", { chat });

      io.to(`chat_${chatId}`).emit("agent_connected", {
        chat,
        agent: chat.assignedAgent
      });

      // Notify ALL OTHER agents to remove the broadcast popup
      io.to("agents_room").emit("chat_claimed_by_other", {
        chatId,
        claimedBy: agent.name,
        claimedById: agent.id
      });

      broadcastAgentList(io);
      broadcastMetrics(io);
    });

    // ------------------------------------
    // AGENT RESUMES ONGOING ACTIVE CHAT
    // ------------------------------------
    socket.on("agent_resume_chat", ({ agentId, chatId }) => {
      let chat = chatId ? liveChats[chatId] : null;
      if (!chat) {
        chat = Object.values(liveChats).find(
          c => c.status === "active" && (c.assignedAgent?.id === agentId || c.chatId === chatId || c.id === chatId)
        );
      }
      if (chat && chat.status === "active") {
        const cId = chat.chatId || chat.id;
        socket.join(`chat_${cId}`);
        socket.emit("chat_accept_success", { chat });
        console.log(`> [Socket] Agent ${agentId} reconnected/resumed active chat ${cId}`);
      }
    });

    // ------------------------------------
    // MESSAGING IN CHAT (SAVED TO MONGO)
    // ------------------------------------
    socket.on("send_message", async ({ chatId, sender, senderName, text }) => {
      const chat = liveChats[chatId];
      if (!chat) return;

      const message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        sender,
        senderName,
        text,
        timestamp: new Date().toISOString()
      };

      chat.messages.push(message);

      // Persist message in MongoDB
      try {
        await Chat.updateOne({ chatId }, { $push: { messages: message } });
      } catch (e) {
        console.error("Error saving message to Mongo:", e.message);
      }

      io.to(`chat_${chatId}`).emit("new_message", { chatId, message });

      // ── Push Notification via FCM to assigned agent if customer sent message ──
      if (sender === "customer" && chat.assignedAgent?.id) {
        try {
          let token = liveAgents[chat.assignedAgent.id]?.fcmToken;
          if (!token) {
            const dbAg = await User.findById(chat.assignedAgent.id);
            token = dbAg?.fcmToken;
          }
          if (token) {
            sendAgentPushNotification(token, {
              title: `💬 ${senderName || "Customer"}`,
              body: text || "Sent a message",
              chatId: chatId
            });
          }
        } catch (mPushErr) {
          console.error("> [Push Error msg]:", mPushErr.message);
        }
      }
    });

    // ------------------------------------
    // TYPING INDICATORS
    // ------------------------------------
    socket.on("typing", ({ chatId, sender, isTyping }) => {
      socket.to(`chat_${chatId}`).emit("user_typing", { sender, isTyping });
    });

    // ------------------------------------
    // AGENT INTERNAL NOTES (SAVED TO MONGO)
    // ------------------------------------
    socket.on("add_agent_note", async ({ chatId, agentName, note }) => {
      const chat = liveChats[chatId];
      if (!chat) return;

      const newNote = {
        id: `note_${Date.now()}`,
        author: agentName,
        text: note,
        timestamp: new Date().toISOString()
      };
      chat.notes.push(newNote);

      // Persist note in MongoDB
      try {
        await Chat.updateOne({ chatId }, { $push: { notes: newNote } });
      } catch (e) {
        console.error("Error saving note to Mongo:", e.message);
      }

      io.to(`agent_${chat.assignedAgent?.id}`).emit("chat_notes_updated", { chatId, notes: chat.notes });
    });

    // ------------------------------------
    // RESOLVE / END CHAT (SAVED TO MONGO)
    // ------------------------------------
    socket.on("end_chat", async ({ chatId, resolvedBy, summary, rating }) => {
      const chat = liveChats[chatId];
      if (!chat) return;

      chat.status = "resolved";
      chat.resolvedAt = new Date().toISOString();
      if (summary) chat.summary = summary;
      if (rating) chat.rating = rating;

      const endMsg = {
        id: `msg_end_${Date.now()}`,
        sender: "system",
        senderName: "BPO Dispatch",
        text: `Chat session closed by ${resolvedBy || "Agent"}. Thank you for contacting support!`,
        timestamp: new Date().toISOString()
      };
      chat.messages.push(endMsg);

      // Free the assigned agent
      if (chat.assignedAgent && liveAgents[chat.assignedAgent.id]) {
        const ag = liveAgents[chat.assignedAgent.id];
        ag.status = "available";
        ag.activeChatId = null;
        ag.stats.resolvedToday += 1;
        if (rating) {
          ag.stats.avgRating = Number(((ag.stats.avgRating * 9 + rating) / 10).toFixed(1));
        }

        try {
          await User.updateOne(
            { _id: ag.id },
            {
              status: "available",
              activeChatId: null,
              $inc: { "stats.resolvedToday": 1 }
            }
          );
        } catch (e) {
          console.error("DB agent update error:", e.message);
        }
      }

      // Persist resolution in MongoDB
      try {
        await Chat.updateOne(
          { chatId },
          {
            status: "resolved",
            resolvedAt: new Date(),
            summary: chat.summary,
            rating: chat.rating,
            $push: { messages: endMsg }
          }
        );
        console.log(`> [MongoDB] Chat ${chatId} resolved and archived safely.`);
      } catch (e) {
        console.error("Error updating resolved chat in Mongo:", e.message);
      }

      io.to(`chat_${chatId}`).emit("chat_ended", { chat });
      broadcastAgentList(io);
      broadcastMetrics(io);
    });

    // ------------------------------------
    // CUSTOMER CANCEL REQUEST
    // ------------------------------------
    socket.on("customer_cancel_request", async ({ chatId }) => {
      const chat = liveChats[chatId];
      if (chat && chat.status === "waiting") {
        chat.status = "cancelled";
        try {
          await Chat.updateOne({ chatId }, { status: "cancelled" });
        } catch (e) {
          console.error(e);
        }
        io.to("agents_room").emit("chat_claimed_by_other", {
          chatId,
          claimedBy: "Cancelled by Customer"
        });
        socket.emit("chat_cancelled", { chatId });
        broadcastMetrics(io);
      }
    });

    // ------------------------------------
    // ADMIN OPERATIONS & AUDIT LOGS (MONGODB BACKED)
    // ------------------------------------
    socket.on("admin_get_overview", async () => {
      try {
        const dbChats = await Chat.find().sort({ createdAt: -1 }).limit(100);
        const dbAgents = await User.find({ role: "agent" });
        const dbCanned = await CannedMacro.find().sort({ createdAt: -1 });

        // Synchronize in-memory liveAgents with actual MongoDB state
        const dbAgentIds = new Set(dbAgents.map(a => a._id.toString()));
        for (const id of Object.keys(liveAgents)) {
          if (!dbAgentIds.has(id)) {
            delete liveAgents[id];
          }
        }
        dbAgents.forEach((ag) => {
          const id = ag._id.toString();
          if (!liveAgents[id]) {
            liveAgents[id] = {
              id,
              email: ag.email,
              name: ag.name,
              role: ag.designation || ag.role,
              department: ag.department || "General",
              avatar: ag.avatar,
              status: ag.status || "available",
              terminatedAt: ag.terminatedAt ? ag.terminatedAt.toISOString() : null,
              terminationReason: ag.terminationReason || null,
              socketId: null,
              activeChatId: null,
              stats: ag.stats || { resolvedToday: 0, avgRating: 5.0 },
              createdAt: ag.createdAt ? ag.createdAt.toISOString() : null
            };
          } else {
            liveAgents[id].name = ag.name;
            liveAgents[id].email = ag.email;
            liveAgents[id].role = ag.designation || ag.role;
            liveAgents[id].department = ag.department || "General";
            if (ag.status === "terminated") {
              liveAgents[id].status = "terminated";
              liveAgents[id].terminatedAt = ag.terminatedAt ? ag.terminatedAt.toISOString() : null;
              liveAgents[id].terminationReason = ag.terminationReason || null;
            }
          }
        });

        broadcastAgentList(io);
        broadcastMetrics(io);

        socket.emit("admin_overview_data", {
          chats: dbChats.map(c => ({
            id: c.chatId,
            customer: c.customer,
            subject: c.subject,
            initialMessage: c.initialMessage,
            status: c.status,
            assignedAgent: c.assignedAgent,
            messages: c.messages,
            notes: c.notes,
            summary: c.summary,
            rating: c.rating,
            createdAt: c.createdAt ? c.createdAt.toISOString() : null,
            acceptedAt: c.acceptedAt ? c.acceptedAt.toISOString() : null,
            resolvedAt: c.resolvedAt ? c.resolvedAt.toISOString() : null
          })),
          agents: Object.values(liveAgents),
          cannedResponses: dbCanned.map(c => ({ id: c._id.toString(), title: c.title, text: c.text })),
          metrics: getSystemMetrics()
        });
      } catch (e) {
        console.error("Admin overview fetch error:", e.message);
      }
    });

    socket.on("admin_create_agent", async ({ name, email, password, role, department, avatar }) => {
      try {
        const cleanEmail = (email || `${name.toLowerCase().replace(/\s+/g, ".")}@support.bpo`).toLowerCase().trim();
        
        // Check if user already exists
        const existing = await User.findOne({ email: cleanEmail });
        if (existing) {
          socket.emit("admin_action_error", { message: `Employee with email ${cleanEmail} already exists.` });
          return;
        }

        const passToHash = password && password.trim().length > 0 ? password.trim() : "bpo123";
        const hashedPassword = await bcrypt.hash(passToHash, 10);

        const newDbUser = await User.create({
          name: name.trim(),
          email: cleanEmail,
          password: hashedPassword,
          role: "agent",
          designation: role || "Support Representative",
          department: department || "General",
          avatar: avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
          status: "available"
        });

        const id = newDbUser._id.toString();
        liveAgents[id] = {
          id,
          email: newDbUser.email,
          name: newDbUser.name,
          role: newDbUser.designation,
          department: newDbUser.department,
          avatar: newDbUser.avatar,
          status: "available",
          terminatedAt: null,
          terminationReason: null,
          socketId: null,
          activeChatId: null,
          stats: { resolvedToday: 0, avgRating: 5.0 },
          createdAt: newDbUser.createdAt ? newDbUser.createdAt.toISOString() : new Date().toISOString()
        };

        broadcastAgentList(io);
        broadcastMetrics(io);

        const dbChats = await Chat.find().sort({ createdAt: -1 }).limit(100);
        io.emit("admin_overview_data", {
          chats: dbChats.map(c => ({
            id: c.chatId,
            customer: c.customer,
            subject: c.subject,
            initialMessage: c.initialMessage,
            status: c.status,
            assignedAgent: c.assignedAgent,
            messages: c.messages,
            notes: c.notes,
            summary: c.summary,
            rating: c.rating,
            createdAt: c.createdAt ? c.createdAt.toISOString() : null,
            acceptedAt: c.acceptedAt ? c.acceptedAt.toISOString() : null,
            resolvedAt: c.resolvedAt ? c.resolvedAt.toISOString() : null
          })),
          agents: Object.values(liveAgents),
          metrics: getSystemMetrics()
        });

        socket.emit("admin_action_success", { message: `Support employee ${newDbUser.name} created successfully.` });
      } catch (e) {
        console.error("Error creating agent in Mongo:", e.message);
        socket.emit("admin_action_error", { message: "Error creating employee: " + e.message });
      }
    });

    socket.on("admin_terminate_agent", async ({ agentId, reason }) => {
      try {
        const termReason = reason || "Administrative action";
        const now = new Date();

        await User.updateOne(
          { _id: agentId },
          { 
            status: "terminated",
            terminatedAt: now,
            terminationReason: termReason
          }
        );

        let agent = liveAgents[agentId] || Object.values(liveAgents).find(a => a.id === agentId);
        if (agent) {
          agent.status = "terminated";
          agent.terminatedAt = now.toISOString();
          agent.terminationReason = termReason;

          // If currently connected, notify and disconnect
          if (agent.socketId) {
            io.to(agent.socketId).emit("agent_session_terminated", {
              reason: termReason
            });
            const s = io.sockets.sockets.get(agent.socketId);
            if (s) {
              s.leave("agents_room");
              s.leave(`agent_${agent.id}`);
            }
            agent.socketId = null;
          }

          // If currently in a live chat, resolve it gracefully
          if (agent.activeChatId) {
            const activeChat = liveChats[agent.activeChatId];
            if (activeChat) {
              const terminationMsg = {
                id: `msg_sys_${Date.now()}`,
                sender: "system",
                senderName: "BPO Dispatch",
                text: "Assigned support employee has been terminated by administration. Chat closed.",
                timestamp: now.toISOString()
              };
              activeChat.messages.push(terminationMsg);
              activeChat.status = "resolved";
              activeChat.resolvedAt = now.toISOString();
              activeChat.summary = "Chat closed due to staff termination.";

              io.to(`chat_${activeChat.id}`).emit("chat_resolved", {
                summary: "Chat closed due to staff termination.",
                rating: null
              });

              await Chat.updateOne(
                { chatId: activeChat.id },
                {
                  status: "resolved",
                  resolvedAt: now,
                  summary: "Chat closed due to staff termination.",
                  $push: { messages: terminationMsg }
                }
              );
            }
            agent.activeChatId = null;
          }
        }

        broadcastAgentList(io);
        broadcastMetrics(io);

        const dbChats = await Chat.find().sort({ createdAt: -1 }).limit(100);
        io.emit("admin_overview_data", {
          chats: dbChats.map(c => ({
            id: c.chatId,
            customer: c.customer,
            subject: c.subject,
            initialMessage: c.initialMessage,
            status: c.status,
            assignedAgent: c.assignedAgent,
            messages: c.messages,
            notes: c.notes,
            summary: c.summary,
            rating: c.rating,
            createdAt: c.createdAt ? c.createdAt.toISOString() : null,
            acceptedAt: c.acceptedAt ? c.acceptedAt.toISOString() : null,
            resolvedAt: c.resolvedAt ? c.resolvedAt.toISOString() : null
          })),
          agents: Object.values(liveAgents),
          metrics: getSystemMetrics()
        });

        socket.emit("admin_action_success", { message: "Support employee has been terminated." });
      } catch (e) {
        console.error("Error terminating agent in Mongo:", e.message);
        socket.emit("admin_action_error", { message: "Error terminating employee: " + e.message });
      }
    });

    socket.on("admin_reactivate_agent", async ({ agentId }) => {
      try {
        await User.updateOne(
          { _id: agentId },
          { 
            status: "available",
            terminatedAt: null,
            terminationReason: null
          }
        );

        let agent = liveAgents[agentId] || Object.values(liveAgents).find(a => a.id === agentId);
        if (agent) {
          agent.status = "available";
          agent.terminatedAt = null;
          agent.terminationReason = null;
        }

        broadcastAgentList(io);
        broadcastMetrics(io);

        const dbChats = await Chat.find().sort({ createdAt: -1 }).limit(100);
        io.emit("admin_overview_data", {
          chats: dbChats.map(c => ({
            id: c.chatId,
            customer: c.customer,
            subject: c.subject,
            initialMessage: c.initialMessage,
            status: c.status,
            assignedAgent: c.assignedAgent,
            messages: c.messages,
            notes: c.notes,
            summary: c.summary,
            rating: c.rating,
            createdAt: c.createdAt ? c.createdAt.toISOString() : null,
            acceptedAt: c.acceptedAt ? c.acceptedAt.toISOString() : null,
            resolvedAt: c.resolvedAt ? c.resolvedAt.toISOString() : null
          })),
          agents: Object.values(liveAgents),
          metrics: getSystemMetrics()
        });

        socket.emit("admin_action_success", { message: "Employee account re-activated successfully." });
      } catch (e) {
        console.error("Error reactivating agent:", e.message);
        socket.emit("admin_action_error", { message: "Error reactivating employee: " + e.message });
      }
    });

    socket.on("admin_delete_agent", async ({ agentId }) => {
      try {
        await User.deleteOne({ _id: agentId });
        delete liveAgents[agentId];
        broadcastAgentList(io);
        broadcastMetrics(io);

        const dbChats = await Chat.find().sort({ createdAt: -1 }).limit(100);
        io.emit("admin_overview_data", {
          chats: dbChats.map(c => ({
            id: c.chatId,
            customer: c.customer,
            subject: c.subject,
            initialMessage: c.initialMessage,
            status: c.status,
            assignedAgent: c.assignedAgent,
            messages: c.messages,
            notes: c.notes,
            summary: c.summary,
            rating: c.rating,
            createdAt: c.createdAt ? c.createdAt.toISOString() : null,
            acceptedAt: c.acceptedAt ? c.acceptedAt.toISOString() : null,
            resolvedAt: c.resolvedAt ? c.resolvedAt.toISOString() : null
          })),
          agents: Object.values(liveAgents),
          metrics: getSystemMetrics()
        });

        socket.emit("admin_action_success", { message: "Employee permanently removed from records." });
      } catch (e) {
        console.error("Error deleting agent in Mongo:", e.message);
        socket.emit("admin_action_error", { message: "Error deleting employee: " + e.message });
      }
    });

    socket.on("admin_get_agent_chats", async ({ agentId, agentEmail }) => {
      try {
        const query = {
          $or: [
            { "assignedAgent.id": agentId },
            { "assignedAgent.email": agentEmail }
          ]
        };
        const agentChats = await Chat.find(query).sort({ createdAt: -1 });
        socket.emit("admin_agent_chats_data", {
          agentId,
          chats: agentChats.map(c => ({
            id: c.chatId,
            customer: c.customer,
            subject: c.subject,
            initialMessage: c.initialMessage,
            status: c.status,
            assignedAgent: c.assignedAgent,
            messages: c.messages,
            notes: c.notes,
            summary: c.summary,
            rating: c.rating,
            createdAt: c.createdAt ? c.createdAt.toISOString() : null,
            acceptedAt: c.acceptedAt ? c.acceptedAt.toISOString() : null,
            resolvedAt: c.resolvedAt ? c.resolvedAt.toISOString() : null
          }))
        });
      } catch (e) {
        console.error("Error fetching agent chats:", e.message);
      }
    });

    socket.on("admin_set_agent_status", async ({ agentId, status }) => {
      const agent = liveAgents[agentId];
      if (agent) {
        if (agent.status === "terminated") return;
        agent.status = status;
        try {
          await User.updateOne({ _id: agentId }, { status });
        } catch (e) {
          console.error(e);
        }
        broadcastAgentList(io);
        broadcastMetrics(io);
      }
    });

    socket.on("admin_save_canned", async ({ id, title, text }) => {
      try {
        if (id) {
          await CannedMacro.updateOne({ _id: id }, { title, text });
        } else {
          await CannedMacro.create({ title, text });
        }
        const updated = await CannedMacro.find();
        io.emit("canned_responses_update", updated.map(c => ({ id: c._id.toString(), title: c.title, text: c.text })));
      } catch (e) {
        console.error(e);
      }
    });

    socket.on("admin_delete_canned", async ({ id }) => {
      try {
        await CannedMacro.deleteOne({ _id: id });
        const updated = await CannedMacro.find();
        io.emit("canned_responses_update", updated.map(c => ({ id: c._id.toString(), title: c.title, text: c.text })));
      } catch (e) {
        console.error(e);
      }
    });

    // ------------------------------------
    // CUSTOMER RECONNECT / REJOIN
    // ------------------------------------
    socket.on("customer_rejoin_chat", ({ chatId }) => {
      const chat = liveChats[chatId];
      if (chat && (chat.status === "waiting" || chat.status === "active")) {
        chat.customerConnected = true;
        chat.customerSocketId = socket.id;
        chat.customerDisconnectedAt = null;
        socket.join(`chat_${chatId}`);
        console.log(`> [Socket] Customer re-connected to chat ${chatId}`);

        const presencePayload = {
          chatId: chat.id,
          customerConnected: true,
          customerDisconnectedAt: null
        };

        io.to("agents_room").emit("customer_presence_update", presencePayload);

        if (chat.assignedAgent?.id) {
          io.to(`agent_${chat.assignedAgent.id}`).emit("customer_presence_update", presencePayload);
        }

        Chat.updateOne(
          { chatId: chat.id },
          { customerConnected: true, customerDisconnectedAt: null }
        ).catch(() => {});
      }
    });

    // ------------------------------------
    // DISCONNECT HANDLING
    // ------------------------------------
    socket.on("disconnect", () => {
      // 1. Agent Disconnect
      for (const agentId in liveAgents) {
        if (liveAgents[agentId].socketId === socket.id) {
          liveAgents[agentId].socketId = null;
          if (liveAgents[agentId].status !== "in_chat") {
            liveAgents[agentId].status = "offline";
          }
          broadcastAgentList(io);
          broadcastMetrics(io);
          break;
        }
      }

      // 2. Customer Disconnect (track if customer left while waiting or in chat)
      for (const chatId in liveChats) {
        const chat = liveChats[chatId];
        if (
          (chat.customerSocketId === socket.id || chat.customer?.id === socket.id) &&
          (chat.status === "waiting" || chat.status === "active")
        ) {
          chat.customerConnected = false;
          chat.customerDisconnectedAt = new Date().toISOString();
          console.log(`> [Socket] Customer disconnected from chat ${chatId} (${chat.customer?.name || "Customer"})`);

          const presencePayload = {
            chatId: chat.id,
            customerConnected: false,
            customerDisconnectedAt: chat.customerDisconnectedAt
          };

          io.to("agents_room").emit("customer_presence_update", presencePayload);

          if (chat.assignedAgent?.id) {
            io.to(`agent_${chat.assignedAgent.id}`).emit("customer_presence_update", presencePayload);
          }

          Chat.updateOne(
            { chatId: chat.id },
            { customerConnected: false, customerDisconnectedAt: new Date() }
          ).catch(() => {});
        }
      }
    });
  });

  httpServer.listen(port, "0.0.0.0", () => {
    console.log(`> BPO Chat Support System ready on port ${port} (Local: http://localhost:${port} | Wi-Fi: http://192.168.1.46:${port})`);
  });
});
