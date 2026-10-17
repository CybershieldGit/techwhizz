// lib/models/agent_model.dart

class AgentModel {
  final String id;
  final String name;
  final String email;
  final String role;
  final String department;
  final String? avatar;
  final String status;
  final String? activeChatId;
  final Map<String, dynamic>? stats;
  final String? terminationReason;

  AgentModel({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.department,
    this.avatar,
    required this.status,
    this.activeChatId,
    this.stats,
    this.terminationReason,
  });

  factory AgentModel.fromJson(Map<String, dynamic> json) {
    return AgentModel(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? json['designation'] ?? 'Support Agent',
      department: json['department'] ?? 'General',
      avatar: json['avatar'],
      status: json['status'] ?? 'offline',
      activeChatId: json['activeChatId'],
      stats: json['stats'] != null ? Map<String, dynamic>.from(json['stats']) : null,
      terminationReason: json['terminationReason'],
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'email': email,
    'role': role,
    'department': department,
    'avatar': avatar,
    'status': status,
    'activeChatId': activeChatId,
    'stats': stats,
  };

  bool get isAvailable => status == 'available';
  bool get isInChat => status == 'in_chat';
  bool get isBusy => status == 'busy';
  bool get isOffline => status == 'offline';
  bool get isTerminated => status == 'terminated';

  int get resolvedToday => stats?['resolvedToday'] ?? 0;
  double get avgRating => (stats?['avgRating'] ?? 5.0).toDouble();

  AgentModel copyWith({String? status, String? activeChatId}) {
    return AgentModel(
      id: id, name: name, email: email, role: role,
      department: department, avatar: avatar,
      status: status ?? this.status,
      activeChatId: activeChatId ?? this.activeChatId,
      stats: stats,
      terminationReason: terminationReason,
    );
  }
}
