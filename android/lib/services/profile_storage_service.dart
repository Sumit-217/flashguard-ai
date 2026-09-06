import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../models/user_profile.dart';

/// Persists [UserProfile] using the platform keystore/keychain
/// (via `flutter_secure_storage`) rather than plain SharedPreferences,
/// since the record includes a government ID number (Aadhaar).
///
/// Also stores the user's opt-in choice for continuous location sharing,
/// so the toggle survives app restarts but always defaults to OFF.
class ProfileStorageService {
  static const _profileKey = 'flashguard.profile.v1';
  static const _sharingEnabledKey = 'flashguard.location_sharing_enabled.v1';

  final FlutterSecureStorage _storage;

  ProfileStorageService({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage();

  Future<UserProfile> loadProfile() async {
    try {
      final raw = await _storage.read(key: _profileKey);
      if (raw == null) return UserProfile.empty;
      return UserProfile.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return UserProfile.empty;
    }
  }

  Future<void> saveProfile(UserProfile profile) async {
    await _storage.write(key: _profileKey, value: jsonEncode(profile.toJson()));
  }

  Future<void> clearProfile() async {
    await _storage.delete(key: _profileKey);
  }

  /// Location sharing always defaults to OFF (opt-in, not opt-out) unless
  /// explicitly turned on before.
  Future<bool> loadSharingEnabled() async {
    final raw = await _storage.read(key: _sharingEnabledKey);
    return raw == 'true';
  }

  Future<void> saveSharingEnabled(bool enabled) async {
    await _storage.write(key: _sharingEnabledKey, value: enabled.toString());
  }
}
