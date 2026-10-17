// lib/core/constants.dart
// ─────────────────────────────────────────────────────────
// Central config for the OmniFlow BPO Agent App.
// With 'adb reverse tcp:3001 tcp:3001', localhost:3001 works
// on both USB-connected physical devices and local desktop.
// ─────────────────────────────────────────────────────────

import 'package:shared_preferences/shared_preferences.dart';

class AppConstants {
  // ── Server URL ────────────────────────────────────────────
  static const String serverUrlKey = 'bpo_server_url';
  static String serverUrl = 'http://localhost:3001';

  static Future<void> loadServerUrl() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getString(serverUrlKey);
      if (saved != null && saved.trim().isNotEmpty) {
        serverUrl = saved.trim();
      }
    } catch (_) {}
  }

  static Future<void> setServerUrl(String url) async {
    serverUrl = url.trim();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(serverUrlKey, serverUrl);
    } catch (_) {}
  }

  // ── API Endpoints ─────────────────────────────────────────
  static const String loginEndpoint = '/api/auth/login';

  // ── SharedPreferences Keys ────────────────────────────────
  static const String sessionKey = 'bpo_agent_session';

  // ── Socket Events — Emitted by client ─────────────────────
  static const String evtAgentRegister = 'agent_register';
  static const String evtAgentRegisterFcm = 'agent_register_fcm_token';
  static const String evtAgentUpdateStatus = 'agent_update_status';
  static const String evtAgentAcceptChat = 'agent_accept_chat';
  static const String evtAgentResumeChat = 'agent_resume_chat';
  static const String evtSendMessage = 'send_message';
  static const String evtTyping = 'typing';
  static const String evtAddNote = 'add_agent_note';
  static const String evtEndChat = 'end_chat';

  // ── Socket Events — Received from server ──────────────────
  static const String evtAgentRegistered = 'agent_registered';
  static const String evtAgentsUpdate = 'agents_update';
  static const String evtMetricsUpdate = 'metrics_update';
  static const String evtIncomingBroadcast = 'incoming_chat_broadcast';
  static const String evtChatClaimedByOther = 'chat_claimed_by_other';
  static const String evtChatAcceptSuccess = 'chat_accept_success';
  static const String evtChatAcceptFailed = 'chat_accept_failed';
  static const String evtAgentConnected = 'agent_connected';
  static const String evtNewMessage = 'new_message';
  static const String evtUserTyping = 'user_typing';
  static const String evtChatEnded = 'chat_ended';
  static const String evtNotesUpdated = 'chat_notes_updated';
  static const String evtSessionTerminated = 'agent_session_terminated';

  // ── Canned Macros ─────────────────────────────────────────
  static const List<Map<String, String>> cannedMacros = [
    {
      'label': '👋 Greeting',
      'text': 'Hello! Thank you for contacting our support team. How may I assist you with this issue today?',
    },
    {
      'label': '⏳ Checking Logs',
      'text': 'I have reviewed your query details and am checking the backend records right now. Please allow me 2 minutes.',
    },
    {
      'label': '✅ Fix Applied',
      'text': 'I have applied the fix to your account. Could you please refresh your page and confirm if it works as expected?',
    },
    {
      'label': '❓ Anything Else?',
      'text': 'Is there anything else I can assist you with before we wrap up today?',
    },
    {
      'label': '🔼 Escalating',
      'text': 'I am escalating this ticket to our senior engineering specialists for further inspection.',
    },
  ];
}
