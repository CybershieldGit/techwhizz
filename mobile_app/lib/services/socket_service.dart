// lib/services/socket_service.dart
// ─────────────────────────────────────────────────────────
// Manages the Socket.io connection lifecycle.
// Emits and receives all BPO chat events.
// ─────────────────────────────────────────────────────────

import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../core/constants.dart';

typedef SocketCallback = void Function(dynamic data);

class SocketService {
  static io.Socket? _socket;
  static bool _isConnected = false;

  static bool get isConnected => _isConnected;
  static io.Socket? get socket => _socket;

  // ── Connect ───────────────────────────────────────────────
  static io.Socket connect() {
    if (_socket != null && _socket!.connected) return _socket!;

    _socket = io.io(
      AppConstants.serverUrl,
      io.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .setReconnectionAttempts(20)
          .setReconnectionDelay(1000)
          .enableAutoConnect()
          .enableReconnection()
          .build(),
    );

    _socket!.onConnect((_) {
      debugPrint('> [Socket] Connected to ${AppConstants.serverUrl}');
      _isConnected = true;
    });

    _socket!.onConnectError((err) {
      debugPrint('> [Socket] Connect Error: $err');
    });

    _socket!.onError((err) {
      debugPrint('> [Socket] Error: $err');
    });

    _socket!.onDisconnect((reason) {
      debugPrint('> [Socket] Disconnected: $reason');
      _isConnected = false;
    });

    _socket!.connect();
    return _socket!;
  }

  // ── Disconnect ────────────────────────────────────────────
  static void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _isConnected = false;
  }

  // ── Emit Helpers ──────────────────────────────────────────
  static void emit(String event, [dynamic data]) {
    _socket?.emit(event, data);
  }

  static void on(String event, SocketCallback callback) {
    _socket?.on(event, callback);
  }

  static void off(String event, [SocketCallback? callback]) {
    if (callback != null) {
      _socket?.off(event, callback);
    } else {
      _socket?.off(event);
    }
  }

  // ── Agent Events ──────────────────────────────────────────
  static void registerAgent(String agentId, {String status = 'available'}) {
    emit(AppConstants.evtAgentRegister, {
      'agentId': agentId,
      'status': status,
    });
  }

  static void registerFcmToken(String agentId, String fcmToken) {
    emit(AppConstants.evtAgentRegisterFcm, {
      'agentId': agentId,
      'fcmToken': fcmToken,
    });
  }

  static void updateStatus(String agentId, String status) {
    emit(AppConstants.evtAgentUpdateStatus, {
      'agentId': agentId,
      'status': status,
    });
  }

  static void acceptChat(String agentId, String chatId) {
    emit(AppConstants.evtAgentAcceptChat, {
      'agentId': agentId,
      'chatId': chatId,
    });
  }

  static void resumeChat(String agentId, String chatId) {
    emit(AppConstants.evtAgentResumeChat, {
      'agentId': agentId,
      'chatId': chatId,
    });
  }

  static void sendMessage({
    required String chatId,
    required String senderName,
    required String text,
  }) {
    emit(AppConstants.evtSendMessage, {
      'chatId': chatId,
      'sender': 'agent',
      'senderName': senderName,
      'text': text,
    });
  }

  static void sendTyping({
    required String chatId,
    required bool isTyping,
  }) {
    emit(AppConstants.evtTyping, {
      'chatId': chatId,
      'sender': 'agent',
      'isTyping': isTyping,
    });
  }

  static void addNote({
    required String chatId,
    required String agentName,
    required String note,
  }) {
    emit(AppConstants.evtAddNote, {
      'chatId': chatId,
      'agentName': agentName,
      'note': note,
    });
  }

  static void endChat({
    required String chatId,
    required String resolvedBy,
    String? summary,
  }) {
    emit(AppConstants.evtEndChat, {
      'chatId': chatId,
      'resolvedBy': resolvedBy,
      if (summary != null && summary.isNotEmpty) 'summary': summary,
    });
  }
}
