// lib/models/chat_model.dart

import 'message_model.dart';

class ChatModel {
  final String id;
  final CustomerInfo customer;
  final String subject;
  final String initialMessage;
  final String status;
  final Map<String, dynamic>? assignedAgent;
  final List<MessageModel> messages;
  final List<Map<String, dynamic>> notes;
  final String? summary;
  final int? rating;
  final bool customerConnected;
  final DateTime? customerDisconnectedAt;
  final DateTime createdAt;
  final DateTime? acceptedAt;
  final DateTime? resolvedAt;

  ChatModel({
    required this.id,
    required this.customer,
    required this.subject,
    required this.initialMessage,
    required this.status,
    this.customerConnected = true,
    this.customerDisconnectedAt,
    this.assignedAgent,
    required this.messages,
    required this.notes,
    this.summary,
    this.rating,
    required this.createdAt,
    this.acceptedAt,
    this.resolvedAt,
  });

  factory ChatModel.fromJson(Map<String, dynamic> json) {
    final msgs = (json['messages'] as List<dynamic>? ?? [])
        .map((m) => MessageModel.fromJson(Map<String, dynamic>.from(m)))
        .toList();

    final notesList = (json['notes'] as List<dynamic>? ?? [])
        .map((n) => Map<String, dynamic>.from(n))
        .toList();

    return ChatModel(
      id: json['id']?.toString() ?? json['chatId']?.toString() ?? '',
      customer: CustomerInfo.fromJson(
        Map<String, dynamic>.from(json['customer'] ?? {}),
      ),
      subject: json['subject'] ?? 'Customer Inquiry',
      initialMessage: json['initialMessage'] ?? '',
      status: json['status'] ?? 'waiting',
      customerConnected: json['customerConnected'] != false,
      customerDisconnectedAt: json['customerDisconnectedAt'] != null
          ? DateTime.tryParse(json['customerDisconnectedAt'].toString())
          : null,
      assignedAgent: json['assignedAgent'] != null
          ? Map<String, dynamic>.from(json['assignedAgent'])
          : null,
      messages: msgs,
      notes: notesList,
      summary: json['summary'],
      rating: json['rating'],
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      acceptedAt: json['acceptedAt'] != null
          ? DateTime.tryParse(json['acceptedAt'].toString())
          : null,
      resolvedAt: json['resolvedAt'] != null
          ? DateTime.tryParse(json['resolvedAt'].toString())
          : null,
    );
  }

  bool get isWaiting => status == 'waiting';
  bool get isActive => status == 'active';
  bool get isResolved => status == 'resolved';

  String get shortId => id.length > 12 ? id.substring(5, 12) : id;
}
