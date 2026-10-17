// lib/main.dart
// ─────────────────────────────────────────────────────────
// OmniFlow BPO Agent Mobile App Entry Point
// ─────────────────────────────────────────────────────────

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:firebase_core/firebase_core.dart';
import 'core/constants.dart';
import 'core/router.dart';
import 'core/theme.dart';
import 'providers/agent_provider.dart';
import 'services/fcm_service.dart';
import 'services/auth_service.dart';
import 'services/socket_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await AppConstants.loadServerUrl();

  // Initialize Firebase safely
  try {
    await Firebase.initializeApp();
    await FcmService.initialize(
      onNotificationTap: (chatId) {
        final routerContext = rootNavigatorKey.currentContext;
        if (routerContext != null) {
          final id = chatId.replaceFirst('chat_', '');
          routerContext.push('/chat/$id');
        }
      },
      onTokenRefresh: (newToken) async {
        final agent = await AuthService.loadSavedSession();
        if (agent != null) {
          SocketService.registerFcmToken(agent.id, newToken);
        }
      },
    );
  } catch (e) {
    debugPrint('Firebase init bypassed in development mode: $e');
  }

  runApp(const OmniFlowAgentApp());
}

class OmniFlowAgentApp extends StatefulWidget {
  const OmniFlowAgentApp({super.key});

  @override
  State<OmniFlowAgentApp> createState() => _OmniFlowAgentAppState();
}

class _OmniFlowAgentAppState extends State<OmniFlowAgentApp> {
  late final AgentProvider _agentProvider;
  late final dynamic _router;

  @override
  void initState() {
    super.initState();
    _agentProvider = AgentProvider();
    _router = buildRouter(_agentProvider);
  }

  @override
  void dispose() {
    _agentProvider.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<AgentProvider>.value(value: _agentProvider),
      ],
      child: MaterialApp.router(
        title: 'OmniFlow Agent',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        routerConfig: _router,
      ),
    );
  }
}
