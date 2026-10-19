import { connectDB } from "../lib/db.js";
import User from "../models/User.js";
import Chat from "../models/Chat.js";

async function run() {
  await connectDB();
  const activeChats = await Chat.find({ status: { $in: ["waiting", "active"] } });
  console.log("Active or Waiting chats in MongoDB:", activeChats.map(c => ({ chatId: c.chatId, status: c.status, assignedAgent: c.assignedAgent?.name, customer: c.customer?.name })));


  const agents = await User.find({ role: "agent" });
  console.log("Agents now:", agents.map(a => ({ name: a.name, status: a.status })));
  process.exit(0);
}

run();
