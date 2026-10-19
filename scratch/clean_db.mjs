import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("MONGODB_URI is not set!");
  process.exit(1);
}

async function main() {
  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(uri);
  console.log("Connected successfully.");

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();

  console.log("Found collections:", collections.map(c => c.name));

  for (const col of collections) {
    const name = col.name.toLowerCase();
    // Keep users and canned macros
    if (name.includes("user") || name.includes("canned")) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`[PRESERVED] Collection '${col.name}': preserved (${count} documents).`);
    } else {
      const countBefore = await db.collection(col.name).countDocuments();
      await db.collection(col.name).deleteMany({});
      console.log(`[CLEARED] Collection '${col.name}': deleted ${countBefore} documents.`);
    }
  }

  // Reset agent presence & stats to a pristine available state
  const usersCollection = db.collection("users");
  const updateResult = await usersCollection.updateMany(
    { role: "agent", status: { $ne: "terminated" } },
    { $set: { activeChatId: null, status: "available", "stats.resolvedToday": 0 } }
  );
  console.log(`[USERS] Reset ${updateResult.modifiedCount} agents to status 'available' with activeChatId null and resolvedToday 0.`);

  // Verify users
  const remainingUsers = await usersCollection.find({}, { projection: { name: 1, email: 1, role: 1, status: 1 } }).toArray();
  console.log("Users in database:", remainingUsers);

  console.log("\n✅ Database clean up complete! All test chats wiped. All users preserved.");
  await mongoose.disconnect();
}

main().catch(err => {
  console.error("Error during DB clean up:", err);
  process.exit(1);
});
