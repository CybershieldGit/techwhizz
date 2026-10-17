import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    sender: { type: String, enum: ["customer", "agent", "system"], required: true },
    senderName: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const NoteSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    author: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ChatSchema = new mongoose.Schema(
  {
    chatId: { type: String, required: true, unique: true, index: true },
    customer: {
      id: { type: String },
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, default: null },
      department: { type: String, default: "General" },
    },
    subject: { type: String, required: true },
    initialMessage: { type: String, required: true },
    status: {
      type: String,
      enum: ["waiting", "active", "resolved", "cancelled"],
      default: "waiting",
      index: true,
    },
    customerConnected: { type: Boolean, default: true },
    customerDisconnectedAt: { type: Date, default: null },
    assignedAgent: {
      id: { type: String },
      name: { type: String },
      email: { type: String },
      role: { type: String },
      department: { type: String },
      avatar: { type: String },
    },
    messages: [MessageSchema],
    notes: [NoteSchema],
    summary: { type: String, default: null },
    rating: { type: Number, default: null },
    createdAt: { type: Date, default: Date.now, index: true },
    acceptedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Chat || mongoose.model("Chat", ChatSchema);
