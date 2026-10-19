import { connectDB } from "../lib/db.js";
import Chat from "../models/Chat.js";
import User from "../models/User.js";

async function run() {
  await connectDB();
  await Chat.updateMany({ status: { $ne: "resolved" } }, { status: "resolved", resolvedAt: new Date(), summary: "Auto-resolved prior session" });
  await User.updateMany({ role: "agent", status: { $ne: "terminated" } }, { status: "available", activeChatId: null });
  console.log("Successfully reset all agents to available and all chats to resolved.");
  process.exit(0);
}

run();
