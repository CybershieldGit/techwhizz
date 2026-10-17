import bcrypt from "bcryptjs";
import User from "../models/User.js";
import CannedMacro from "../models/CannedMacro.js";
import Chat from "../models/Chat.js";

export async function initDatabase() {
  try {
    // 1. Ensure Admin Account Exists
    const adminEmail = "admin@bpo.com";
    const existingAdmin = await User.findOne({ email: adminEmail });
    const isBrandNewSetup = !existingAdmin && (await User.countDocuments()) === 0;

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await User.create({
        name: "Operations Director",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        designation: "System Administrator",
        department: "Operations",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
      });
      console.log("> [DB Seed] Created default admin account: admin@bpo.com / admin123");
    }

    // 2. Ensure Support Agents Exist ONLY on initial pristine database creation
    // If the database is already initialized, respect user deletions and do NOT re-seed
    if (isBrandNewSetup) {
      const defaultAgents = [
        {
          email: "alex@support.bpo",
          name: "Alex Rivera",
          designation: "Senior Technical Support",
          department: "Technical",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          stats: { resolvedToday: 8, avgRating: 4.9 }
        },
        {
          email: "sarah@support.bpo",
          name: "Sarah Chen",
          designation: "Billing & Accounts Lead",
          department: "Billing",
          avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
          stats: { resolvedToday: 12, avgRating: 4.8 }
        },
        {
          email: "marcus@support.bpo",
          name: "Marcus Vance",
          designation: "Customer Success Rep",
          department: "General",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
          stats: { resolvedToday: 6, avgRating: 4.7 }
        },
        {
          email: "priya@support.bpo",
          name: "Priya Patel",
          designation: "Escalations Specialist",
          department: "Technical",
          avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
          stats: { resolvedToday: 9, avgRating: 5.0 }
        }
      ];

      const defaultAgentPasswordHash = await bcrypt.hash("bpo123", 10);

      for (const agentData of defaultAgents) {
        const exists = await User.findOne({ email: agentData.email });
        if (!exists) {
          await User.create({
            ...agentData,
            password: defaultAgentPasswordHash,
            role: "agent",
            status: "available"
          });
          console.log(`> [DB Seed] Created support agent: ${agentData.name} (${agentData.email})`);
        }
      }
    }

    // 3. Ensure Canned Responses Exist
    const cannedCount = await CannedMacro.countDocuments();
    if (cannedCount === 0) {
      await CannedMacro.insertMany([
        { title: "Greeting", text: "Hello! Welcome to Support. How can I assist you with this issue today?" },
        { title: "Investigating Logs", text: "I have reviewed your query details and am checking the backend records right now. Please allow me 2 minutes." },
        { title: "Fix Applied", text: "I have applied the fix to your account. Could you please refresh your page and confirm if it works as expected?" },
        { title: "Anything Else", text: "Is there anything else I can assist you with before we wrap up today?" },
        { title: "Escalation Notice", text: "I am escalating this ticket to our senior engineering specialists for further inspection." }
      ]);
      console.log("> [DB Seed] Seeded standard canned responses");
    }

    // 4. Ensure Sample Resolved Chats for Audit Logs
    const chatCount = await Chat.countDocuments();
    if (chatCount === 0) {
      await Chat.insertMany([
        {
          chatId: `chat_init_1`,
          customer: { id: "cust_seed_1", name: "Elena Rostova", email: "elena@vanguard.io", department: "Billing" },
          subject: "Prorated Annual Seat License Adjustment",
          initialMessage: "We downsized our sales team from 50 to 35 seats and need the credit invoice applied.",
          status: "resolved",
          assignedAgent: { id: "agent_2", name: "Sarah Chen", email: "sarah@support.bpo", role: "Billing & Accounts Lead", department: "Billing" },
          messages: [
            { id: "msg_s1", sender: "customer", senderName: "Elena Rostova", text: "We downsized our sales team from 50 to 35 seats and need the credit invoice applied.", timestamp: new Date(Date.now() - 3600000) },
            { id: "msg_s2", sender: "agent", senderName: "Sarah Chen", text: "Hello Elena! I have verified your contract amendment and processed a prorated credit memo of $1,800 to your ledger.", timestamp: new Date(Date.now() - 3200000) }
          ],
          notes: [{ id: "n_s1", author: "Sarah Chen", text: "Verified downgrade signed by VP Sales. Credit memo #CM-884 issued.", timestamp: new Date() }],
          createdAt: new Date(Date.now() - 3700000),
          acceptedAt: new Date(Date.now() - 3650000),
          resolvedAt: new Date(Date.now() - 3100000),
          summary: "Credit memo applied and seat count adjusted to 35 licenses.",
          rating: 5
        },
        {
          chatId: `chat_init_2`,
          customer: { id: "cust_seed_2", name: "Devon Miles", email: "devon@cloudnexus.net", department: "Technical" },
          subject: "OAuth Webhook Callback Timeout (504)",
          initialMessage: "Our EU-West cluster is experiencing timeouts when receiving batch events.",
          status: "resolved",
          assignedAgent: { id: "agent_1", name: "Alex Rivera", email: "alex@support.bpo", role: "Senior Technical Support", department: "Technical" },
          messages: [
            { id: "msg_s3", sender: "customer", senderName: "Devon Miles", text: "Our EU-West cluster is experiencing timeouts when receiving batch events.", timestamp: new Date(Date.now() - 7200000) },
            { id: "msg_s4", sender: "agent", senderName: "Alex Rivera", text: "Hi Devon. I increased the webhook handshake timeout on edge router proxy from 2s to 6s and re-queued the failed batches.", timestamp: new Date(Date.now() - 6800000) }
          ],
          notes: [{ id: "n_s2", author: "Alex Rivera", text: "Proxy edge config patched. Customer confirmed 200 OK across all endpoints.", timestamp: new Date() }],
          createdAt: new Date(Date.now() - 7400000),
          acceptedAt: new Date(Date.now() - 7300000),
          resolvedAt: new Date(Date.now() - 6700000),
          summary: "Edge timeout increased to 6s and webhook replay completed successfully.",
          rating: 5
        }
      ]);
      console.log("> [DB Seed] Seeded historical resolved chats for audit logs");
    }

  } catch (error) {
    console.error("> [DB Seed] Error initializing database:", error);
  }
}
