import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "agent"], required: true },
    // Agent specific fields
    designation: { type: String, default: "Support Representative" },
    department: { type: String, default: "General" },
    avatar: { type: String, default: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" },
    status: { type: String, enum: ["available", "busy", "in_chat", "offline", "terminated"], default: "available" },
    terminatedAt: { type: Date, default: null },
    terminationReason: { type: String, default: null },
    activeChatId: { type: String, default: null },
    socketId: { type: String, default: null },
    fcmToken: { type: String, default: null },
    stats: {
      resolvedToday: { type: Number, default: 0 },
      avgRating: { type: Number, default: 5.0 },
    },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
