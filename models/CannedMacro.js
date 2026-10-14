import mongoose from "mongoose";

const CannedMacroSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.CannedMacro || mongoose.model("CannedMacro", CannedMacroSchema);
