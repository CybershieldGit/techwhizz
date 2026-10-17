// lib/services/fcm_service.dart
// ─────────────────────────────────────────────────────────
// Firebase Cloud Messaging + Local Notifications setup.
// Handles foreground notifications (via flutter_local_notifications)
// and background tap routing.
// ─────────────────────────────────────────────────────────

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter/material.dart';

// Top-level background handler (must be top-level function, not a class method)
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // No need to init Firebase here since it's already done in main.
  // Just show a local notification:
  await FcmService._showLocalNotification(message);
}

class FcmService {
  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  static const String _channelId = 'omniflow_incoming';
  static const String _channelName = 'Incoming Customer Chats';
  static const String _channelDescription =
      'High-priority alerts for new customer support requests';

  // ── Initialize ────────────────────────────────────────────
  static Future<void> initialize({
    required void Function(String chatId) onNotificationTap,
  }) async {
    // 1. Android notification channel (high importance + sound)
    const androidChannel = AndroidNotificationChannel(
      _channelId,
      _channelName,
      description: _channelDescription,
      importance: Importance.max,
      playSound: true,
      enableVibration: true,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(androidChannel);

    // 2. Local notifications init
    const initializationSettings = InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
    );

    await _localNotifications.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: (details) {
        final payload = details.payload;
        if (payload != null && payload.startsWith('chat_')) {
          onNotificationTap(payload);
        }
      },
    );

    // 3. Request FCM permission
    final messaging = FirebaseMessaging.instance;
    await messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    // 4. Foreground message handler
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      _showLocalNotification(message);
    });

    // 5. Handle notification tap when app is in background (not killed)
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      final chatId = message.data['chatId'];
      if (chatId != null) {
        onNotificationTap(chatId);
      }
    });

    // 6. Handle notification tap when app was killed
    final initialMessage = await messaging.getInitialMessage();
    if (initialMessage != null) {
      final chatId = initialMessage.data['chatId'];
      if (chatId != null) {
        // Slight delay so the widget tree is ready
        await Future.delayed(const Duration(milliseconds: 500));
        onNotificationTap(chatId);
      }
    }
  }

  // ── Get FCM Token ─────────────────────────────────────────
  static Future<String?> getToken() async {
    return await FirebaseMessaging.instance.getToken();
  }

  // ── Show Local Notification ───────────────────────────────
  static Future<void> _showLocalNotification(RemoteMessage message) async {
    final notification = message.notification;
    final data = message.data;

    final title = notification?.title ??
        '🚨 New Chat: ${data['customerName'] ?? 'Customer'}';
    final body = notification?.body ?? data['subject'] ?? 'New support request';
    final chatId = data['chatId'] ?? '';

    final androidDetails = AndroidNotificationDetails(
      _channelId,
      _channelName,
      channelDescription: _channelDescription,
      importance: Importance.max,
      priority: Priority.high,
      playSound: true,
      enableVibration: true,
      color: const Color(0xFF059669),
      icon: '@mipmap/ic_launcher',
      styleInformation: BigTextStyleInformation(body),
    );

    await _localNotifications.show(
      chatId.hashCode,
      title,
      body,
      NotificationDetails(android: androidDetails),
      payload: chatId,
    );
  }

  // ── Show Simple Local Alert ───────────────────────────────
  static Future<void> showLocalAlert({
    required String title,
    required String body,
    String? payload,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      _channelId,
      _channelName,
      channelDescription: _channelDescription,
      importance: Importance.high,
      priority: Priority.high,
      playSound: true,
      enableVibration: true,
      color: Color(0xFF059669),
    );

    await _localNotifications.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title,
      body,
      const NotificationDetails(android: androidDetails),
      payload: payload,
    );
  }
}
