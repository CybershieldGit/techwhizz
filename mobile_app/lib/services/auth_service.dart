// lib/services/auth_service.dart
// ─────────────────────────────────────────────────────────
// Handles login via POST /api/auth/login and session persistence.
// ─────────────────────────────────────────────────────────

import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants.dart';
import '../models/agent_model.dart';

class AuthResult {
  final bool success;
  final AgentModel? agent;
  final String? error;

  AuthResult({required this.success, this.agent, this.error});
}

class AuthService {
  // ── Login ─────────────────────────────────────────────────
  static Future<AuthResult> login({
    required String email,
    required String password,
  }) async {
    try {
      final uri = Uri.parse('${AppConstants.serverUrl}${AppConstants.loginEndpoint}');
      final response = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email.trim().toLowerCase(),
          'password': password,
          'portal': 'support',
        }),
      ).timeout(const Duration(seconds: 15));

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        final agent = AgentModel.fromJson(Map<String, dynamic>.from(data['user']));
        await _saveSession(data['user']);
        return AuthResult(success: true, agent: agent);
      } else {
        return AuthResult(
          success: false,
          error: data['error'] ?? 'Authentication failed.',
        );
      }
    } catch (e) {
      return AuthResult(
        success: false,
        error: 'Connection error: ${e.toString()}',
      );
    }
  }

  // ── Load Saved Session ────────────────────────────────────
  static Future<AgentModel?> loadSavedSession() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getString(AppConstants.sessionKey);
      if (saved == null) return null;

      final json = jsonDecode(saved) as Map<String, dynamic>;
      if (json['role'] != 'agent' && json['role'] != 'admin') return null;

      return AgentModel.fromJson(json);
    } catch (_) {
      return null;
    }
  }

  // ── Clear Session ─────────────────────────────────────────
  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConstants.sessionKey);
    await prefs.remove('agent_status_persisted');
  }

  // ── Status Persistence ────────────────────────────────────
  static Future<void> saveAgentStatus(String status) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getString(AppConstants.sessionKey);
      if (saved != null) {
        final json = jsonDecode(saved) as Map<String, dynamic>;
        json['status'] = status;
        await prefs.setString(AppConstants.sessionKey, jsonEncode(json));
      }
      await prefs.setString('agent_status_persisted', status);
    } catch (_) {}
  }

  static Future<String?> getSavedAgentStatus() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString('agent_status_persisted');
    } catch (_) {
      return null;
    }
  }

  // ── Private ───────────────────────────────────────────────
  static Future<void> _saveSession(Map<String, dynamic> userData) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.sessionKey, jsonEncode(userData));
  }
}
