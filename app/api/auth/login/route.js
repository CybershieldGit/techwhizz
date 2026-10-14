import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { email, password, portal } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials. User not found." },
        { status: 401 }
      );
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Also allow direct match if plain text fallback
      if (password !== user.password) {
        return NextResponse.json(
          { error: "Invalid password. Please check your credentials." },
          { status: 401 }
        );
      }
    }

    // Check if account is terminated
    if (user.status === "terminated") {
      return NextResponse.json(
        { 
          error: `Account Terminated: This employee account has been deactivated by administration.${user.terminationReason ? ' Reason: ' + user.terminationReason : ''}` 
        },
        { status: 403 }
      );
    }

    // Role verification based on portal
    if (portal === "admin" && user.role !== "admin") {
      return NextResponse.json(
        { error: "Access Denied: This portal requires Administrator privileges." },
        { status: 403 }
      );
    }

    if (portal === "support" && user.role !== "agent" && user.role !== "admin") {
      return NextResponse.json(
        { error: "Access Denied: This portal is for Support Team members." },
        { status: 403 }
      );
    }

    const userData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      designation: user.designation,
      avatar: user.avatar,
      status: user.status,
      stats: user.stats
    };

    return NextResponse.json({
      success: true,
      user: userData
    });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Server authentication error: " + error.message },
      { status: 500 }
    );
  }
}
