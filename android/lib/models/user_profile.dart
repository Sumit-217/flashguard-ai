/// Minimal on-device identity/contact record used for the "ASK FOR HELP"
/// SOS flow and the periodic location ping. This is deliberately small —
/// just enough for a rescue/admin team to identify and locate the person —
/// not a general-purpose account system.
class UserProfile {
  final String name;
  final String phone;
  final String aadhaarNumber;
  final String emergencyContactName;
  final String emergencyContactPhone;

  const UserProfile({
    this.name = '',
    this.phone = '',
    this.aadhaarNumber = '',
    this.emergencyContactName = '',
    this.emergencyContactPhone = '',
  });

  bool get isComplete => name.trim().isNotEmpty && phone.trim().isNotEmpty;

  /// Aadhaar is a sensitive government ID — never show it in full in the
  /// UI. Only the last 4 digits are surfaced; the rest is masked.
  String get maskedAadhaar {
    final digits = aadhaarNumber.replaceAll(RegExp(r'\D'), '');
    if (digits.length < 4) return digits.isEmpty ? '—' : '•' * digits.length;
    final last4 = digits.substring(digits.length - 4);
    return '•••• •••• $last4';
  }

  UserProfile copyWith({
    String? name,
    String? phone,
    String? aadhaarNumber,
    String? emergencyContactName,
    String? emergencyContactPhone,
  }) {
    return UserProfile(
      name: name ?? this.name,
      phone: phone ?? this.phone,
      aadhaarNumber: aadhaarNumber ?? this.aadhaarNumber,
      emergencyContactName: emergencyContactName ?? this.emergencyContactName,
      emergencyContactPhone: emergencyContactPhone ?? this.emergencyContactPhone,
    );
  }

  Map<String, dynamic> toJson() => {
        'name': name,
        'phone': phone,
        'aadhaar_number': aadhaarNumber,
        'emergency_contact_name': emergencyContactName,
        'emergency_contact_phone': emergencyContactPhone,
      };

  factory UserProfile.fromJson(Map<String, dynamic> json) => UserProfile(
        name: json['name']?.toString() ?? '',
        phone: json['phone']?.toString() ?? '',
        aadhaarNumber: json['aadhaar_number']?.toString() ?? '',
        emergencyContactName: json['emergency_contact_name']?.toString() ?? '',
        emergencyContactPhone: json['emergency_contact_phone']?.toString() ?? '',
      );

  static const empty = UserProfile();
}
