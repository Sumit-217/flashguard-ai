import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';

import '../core/constants/app_constants.dart';
import '../core/network/api_client.dart';
import '../models/user_profile.dart';
import '../services/api_service.dart';
import '../services/profile_storage_service.dart';

enum SosStatus { idle, sending, sent, failed }

/// Owns the user's profile record and the opt-in "share my live location
/// with the admin/rescue server" feature.
///
/// Location sharing is OFF by default and only starts once the user
/// explicitly flips the switch on the Profile screen — this sends the
/// profile (name, phone, Aadhaar) + current GPS fix to
/// [AdminApiConfig.locationPing] every [AdminApiConfig.locationPingInterval]
/// (5s) for as long as the app is open and the toggle stays on.
///
/// Note: this timer only runs while the app is in the foreground. Sending
/// this data from the background/when the app is killed would require an
/// Android foreground service + ACCESS_BACKGROUND_LOCATION, plus Play
/// Store "background location" policy justification — that's a bigger,
/// separate change and isn't wired up here.
class ProfileProvider extends ChangeNotifier {
  final ApiService _api;
  final ProfileStorageService _storage;
  Timer? _pingTimer;

  ProfileProvider({ApiService? api, ProfileStorageService? storage})
      : _api = api ?? ApiService(),
        _storage = storage ?? ProfileStorageService();

  UserProfile _profile = UserProfile.empty;
  UserProfile get profile => _profile;

  bool _isLoaded = false;
  bool get isLoaded => _isLoaded;

  bool _isLocationSharingOn = false;
  bool get isLocationSharingOn => _isLocationSharingOn;

  DateTime? _lastPingAt;
  DateTime? get lastPingAt => _lastPingAt;

  String? _pingError;
  String? get pingError => _pingError;

  SosStatus _sosStatus = SosStatus.idle;
  SosStatus get sosStatus => _sosStatus;

  String? _sosError;
  String? get sosError => _sosError;

  Future<void> initialize() async {
    _profile = await _storage.loadProfile();
    _isLocationSharingOn = await _storage.loadSharingEnabled();
    _isLoaded = true;
    notifyListeners();
    if (_isLocationSharingOn) _startPingTimer();
  }

  Future<void> saveProfile(UserProfile updated) async {
    _profile = updated;
    await _storage.saveProfile(updated);
    notifyListeners();
  }

  Future<void> setLocationSharing(bool enabled) async {
    _isLocationSharingOn = enabled;
    await _storage.saveSharingEnabled(enabled);
    if (enabled) {
      _pingError = null;
      _startPingTimer();
      // Send one immediately rather than waiting 5s for the first sample.
      unawaited(_sendPing());
    } else {
      _pingTimer?.cancel();
      _pingTimer = null;
    }
    notifyListeners();
  }

  void _startPingTimer() {
    _pingTimer?.cancel();
    _pingTimer = Timer.periodic(
      AdminApiConfig.locationPingInterval,
      (_) => _sendPing(),
    );
  }

  Future<void> _sendPing() async {
    if (!_isLocationSharingOn) return;
    try {
      final position = await _currentPosition();
      await _api.sendLocationPing(
        profile: _profile,
        latitude: position.latitude,
        longitude: position.longitude,
        accuracyMeters: position.accuracy,
      );
      _lastPingAt = DateTime.now();
      _pingError = null;
    } on ApiException catch (e) {
      _pingError = e.message;
    } catch (e) {
      _pingError = 'Location ping failed: $e';
    }
    notifyListeners();
  }

  /// One-off SOS action for the "ASK FOR HELP" button. Independent of the
  /// periodic-sharing toggle — works even if continuous sharing is off.
  Future<void> sendHelpRequest({String? message}) async {
    _sosStatus = SosStatus.sending;
    _sosError = null;
    notifyListeners();

    try {
      final position = await _currentPosition();
      await _api.sendHelpRequest(
        profile: _profile,
        latitude: position.latitude,
        longitude: position.longitude,
        accuracyMeters: position.accuracy,
        message: message ?? 'SOS: user requested help from FlashGuard app.',
      );
      _sosStatus = SosStatus.sent;
    } on ApiException catch (e) {
      _sosStatus = SosStatus.failed;
      _sosError = e.message;
    } catch (e) {
      _sosStatus = SosStatus.failed;
      _sosError = 'Could not send help request: $e';
    }
    notifyListeners();
  }

  void resetSosStatus() {
    _sosStatus = SosStatus.idle;
    _sosError = null;
    notifyListeners();
  }

  Future<Position> _currentPosition() async {
    // Ask for permission before checking whether the location service is
    // on — otherwise a phone with location toggled off never even sees
    // the permission prompt.
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      throw ApiException('Location permission was denied.');
    }
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw ApiException('Device location is turned off.');
    }
    return Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        timeLimit: Duration(seconds: 12),
      ),
    );
  }

  @override
  void dispose() {
    _pingTimer?.cancel();
    _api.dispose();
    super.dispose();
  }
}
