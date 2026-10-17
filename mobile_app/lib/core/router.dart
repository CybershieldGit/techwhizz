// lib/core/router.dart
// ─────────────────────────────────────────────────────────
// GoRouter navigation configuration.
// ─────────────────────────────────────────────────────────

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../providers/agent_provider.dart';
import '../screens/splash_screen.dart';
import '../screens/login_screen.dart';
import '../screens/dashboard_screen.dart';
import '../screens/live_chat_screen.dart';

final GlobalKey<NavigatorState> rootNavigatorKey = GlobalKey<NavigatorState>();

GoRouter buildRouter([AgentProvider? agentProvider]) {
  return GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: '/splash',
    redirect: (context, state) {
      AgentProvider? agent = agentProvider;
      if (agent == null) {
        try {
          agent = context.read<AgentProvider>();
        } catch (_) {
          agent = null;
        }
      }
      final isLoggedIn = agent?.isLoggedIn ?? false;
      final path = state.uri.toString();

      if (path == '/splash') return null;
      if (!isLoggedIn && path != '/login') return '/login';
      if (isLoggedIn && path == '/login') return '/dashboard';
      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (_, __) => const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (_, __) => const LoginScreen(),
      ),
      GoRoute(
        path: '/dashboard',
        builder: (_, __) => const DashboardScreen(),
      ),
      GoRoute(
        path: '/chat/:chatId',
        builder: (context, state) {
          final chatId = state.pathParameters['chatId']!;
          return LiveChatScreen(chatId: chatId);
        },
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Text('Page not found: ${state.error}'),
      ),
    ),
  );
}
