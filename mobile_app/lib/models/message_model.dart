// lib/models/message_model.dart

class MessageModel {
  final String id;
  final String sender; // "customer" | "agent" | "system"
  final String senderName;
  final String text;
  final DateTime timestamp;

  MessageModel({
    required this.id,
    required this.sender,
    required this.senderName,
    required this.text,
    required this.timestamp,
  });

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    // If wrapped under 'message', unwrap it
    final data = json['message'] is Map
        ? Map<String, dynamic>.from(json['message'])
        : json;

    final senderStr = data['sender']?.toString() ?? 'system';
    final defaultName = senderStr == 'customer'
        ? 'Customer'
        : (senderStr == 'agent' ? 'Agent' : 'BPO Dispatch');

    return MessageModel(
      id: data['id']?.toString() ?? data['_id']?.toString() ?? '',
      sender: senderStr,
      senderName: data['senderName']?.toString().isNotEmpty == true
          ? data['senderName'].toString()
          : defaultName,
      text: data['text']?.toString() ?? data['message']?.toString() ?? '',
      timestamp: data['timestamp'] != null
          ? DateTime.tryParse(data['timestamp'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  bool get isCustomer => sender == 'customer';
  bool get isAgent => sender == 'agent';
  bool get isSystem => sender == 'system';
}

// lib/models/chat_model.dart
class CustomerInfo {
  final String id;
  final String name;
  final String email;
  final String? phone;
  final String department;
  final String? tier;
  final String? ip;

  CustomerInfo({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    required this.department,
    this.tier,
    this.ip,
  });

  factory CustomerInfo.fromJson(Map<String, dynamic> json) {
    return CustomerInfo(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? 'Customer',
      email: json['email'] ?? '',
      phone: json['phone'],
      department: json['department'] ?? 'General',
      tier: json['tier']?.toString(),
      ip: json['ip']?.toString(),
    );
  }
}
