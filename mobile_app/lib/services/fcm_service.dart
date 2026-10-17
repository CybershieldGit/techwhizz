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
  // If Android OS did not display a notification payload, show via local notifications:
  if (message.notification == null) {
    await FcmService._showLocalNotification(message);
  }
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
    void Function(String token)? onTokenRefresh,
  }) async {
    // 1. Android notification channel (high importance + sound)
    const androidChannel = AndroidNotificationChannel(
      _channelId,
      _channelName,
      description: _channelDescription,
      importance: Importance.max,
      playSound: true,
      enableVibration: true,
      showBadge: true,
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
        if (payload != null && payload.isNotEmpty) {
          onNotificationTap(payload);
        }
      },
    );

    // 3. Android 13+ (API 33+) explicit notification permission prompt
    try {
      final androidImplementation = _localNotifications
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>();
      final granted =
          await androidImplementation?.requestNotificationsPermission();
      debugPrint('> [FCM] Android system notification permission granted: $granted');
    } catch (e) {
      debugPrint('> [FCM] Notification permission request error: $e');
    }

    // 4. Register background message handler
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

    // 5. Request FCM permission
    final messaging = FirebaseMessaging.instance;
    await messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    // 6. Enable heads-up alerts when app is in the FOREGROUND
    await messaging.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );

    // 7. Foreground message handler
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      _showLocalNotification(message);
    });

    // 8. Listen for token refresh and sync immediately
    FirebaseMessaging.instance.onTokenRefresh.listen((newToken) {
      debugPrint('> [FCM] Token refreshed: $newToken');
      onTokenRefresh?.call(newToken);
    });

    // 9. Handle notification tap when app is in background (not killed)
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      final chatId = message.data['chatId'];
      if (chatId != null && chatId.toString().isNotEmpty) {
        onNotificationTap(chatId.toString());
      }
    });

    // 10. Handle notification tap when app was killed
    final initialMessage = await messaging.getInitialMessage();
    if (initialMessage != null) {
      final chatId = initialMessage.data['chatId'];
      if (chatId != null && chatId.toString().isNotEmpty) {
        // Slight delay so the widget tree is ready
        await Future.delayed(const Duration(milliseconds: 600));
        onNotificationTap(chatId.toString());
      }
    }
  }

  // ── Get FCM Token ─────────────────────────────────────────
  static Future<String?> getToken() async {
    try {
      final token = await FirebaseMessaging.instance.getToken();
      debugPrint('> [FCM] Device Token: $token');
      return token;
    } catch (e) {
      debugPrint('> [FCM] Could not get token: $e');
      return null;
    }
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
      color: const Color(0xFF1B3B8B),
      icon: '@mipmap/ic_launcher',
      styleInformation: BigTextStyleInformation(body),
    );

    debugPrint('> [FCM] Showing local notification: $title - $body');
    await _localNotifications.show(
      chatId.hashCode.abs(),
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
      color: Color(0xFF1B3B8B),
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
