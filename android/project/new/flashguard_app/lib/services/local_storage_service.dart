import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../core/constants/app_constants.dart';
import '../models/risk_result.dart';

/// Persists the last successfully-fetched [StateRisk] snapshot so the app
/// has something honest to show when both the live and demo endpoints are
/// unreachable (aeroplane mode, backend down, no signal in the hills).
class LocalStorageService {
  Future<void> saveStateRisk(StateRisk risk, Map<String, dynamic> rawJson) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(StorageKeys.lastStateRiskJson, jsonEncode(rawJson));
    await prefs.setString(
      StorageKeys.lastSyncedAtIso,
      DateTime.now().toUtc().toIso8601String(),
    );
  }

  Future<(StateRisk, DateTime)?> loadCachedStateRisk() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(StorageKeys.lastStateRiskJson);
    final syncedAtRaw = prefs.getString(StorageKeys.lastSyncedAtIso);
    if (raw == null || syncedAtRaw == null) return null;
    try {
      final json = jsonDecode(raw) as Map<String, dynamic>;
      final risk = StateRisk.fromJson(json);
      final syncedAt = DateTime.tryParse(syncedAtRaw) ?? DateTime.now();
      return (risk, syncedAt);
    } catch (_) {
      return null;
    }
  }

  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(StorageKeys.lastStateRiskJson);
    await prefs.remove(StorageKeys.lastSyncedAtIso);
  }
}
