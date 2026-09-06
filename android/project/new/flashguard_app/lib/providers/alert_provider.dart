import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';

import '../core/constants/app_constants.dart';
import '../core/network/api_client.dart';
import '../models/disaster_alert.dart';
import '../models/risk_result.dart';
import '../services/api_service.dart';
import '../services/local_storage_service.dart';
import 'connectivity_provider.dart';

enum LocationStatus { unknown, requesting, granted, denied, serviceDisabled }

/// Central state holder for the app: live GPS position, the current
/// [StateRisk] snapshot (however it was obtained), and the alerts derived
/// from it. Every screen in `features/` reads from this one provider.
///
/// Fetch strategy, in order:
///   1. Live backend  — GET /api/v1/risk/uttarakhand   (real NWDP telemetry)
///   2. Backend demo  — GET /api/v1/demo/risk/uttarakhand (deterministic)
///   3. Local cache   — last snapshot successfully saved on-device
///   4. Give up       — surface a clear "no data" state (OfflineScreen)
class AlertProvider extends ChangeNotifier {
  final ApiService _api;
  final LocalStorageService _storage;
  ConnectivityProvider? _connectivity;
  StreamSubscription<void>? _reconnectSub;
  Timer? _pollTimer;

  AlertProvider({ApiService? api, LocalStorageService? storage})
      : _api = api ?? ApiService(),
        _storage = storage ?? LocalStorageService();

  // --- Location -----------------------------------------------------
  Position? _position;
  Position? get position => _position;
  LocationStatus _locationStatus = LocationStatus.unknown;
  LocationStatus get locationStatus => _locationStatus;

  // --- Risk data ------------------------------------------------------
  StateRisk? _stateRisk;
  StateRisk? get stateRisk => _stateRisk;

  DateTime? _lastSyncedAt;
  DateTime? get lastSyncedAt => _lastSyncedAt;

  bool _isUsingOfflineCache = false;
  bool get isUsingOfflineCache => _isUsingOfflineCache;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  String? _errorMessage;
  String? get errorMessage => _errorMessage;

  bool get hasData => _stateRisk != null;

  /// True only when there is truly nothing to show — no live data, no
  /// demo fallback, and no on-device cache. Drives the OfflineScreen.
  bool get isFullyOffline => !hasData && _errorMessage != null;

  void attachConnectivity(ConnectivityProvider connectivity) {
    _connectivity = connectivity;
    _reconnectSub?.cancel();
    _reconnectSub = connectivity.onReconnected.listen((_) => refresh());
  }

  // --- Derived data -----------------------------------------------------

  /// Nearest telemetry station to the user's current GPS fix, or null if
  /// there's no position fix yet or no stations carry coordinates.
  (StationRisk, double)? get nearestStation {
    final pos = _position;
    final risk = _stateRisk;
    if (pos == null || risk == null) return null;

    StationRisk? best;
    double bestDistance = double.infinity;
    for (final station in risk.allStations) {
      if (!station.hasCoordinates) continue;
      final d = haversineKm(
        pos.latitude,
        pos.longitude,
        station.latitude!,
        station.longitude!,
      );
      if (d < bestDistance) {
        bestDistance = d;
        best = station;
      }
    }
    if (best == null) return null;
    return (best, bestDistance);
  }

  /// Every station currently at HIGH or CRITICAL, sorted worst-first,
  /// annotated with distance from the user when a GPS fix is available.
  List<DisasterAlert> get activeAlerts {
    final risk = _stateRisk;
    if (risk == null) return [];
    final pos = _position;

    final alerts = risk.allStations
        .where((s) => s.riskLevel == RiskTier.high || s.riskLevel == RiskTier.critical)
        .map((s) {
      double? distance;
      if (pos != null && s.hasCoordinates) {
        distance = haversineKm(pos.latitude, pos.longitude, s.latitude!, s.longitude!);
      }
      return DisasterAlert.fromStation(s, distanceKm: distance);
    }).toList();

    alerts.sort((a, b) => b.riskScore.compareTo(a.riskScore));
    return alerts;
  }

  // --- Lifecycle -----------------------------------------------------

  Future<void> initialize() async {
    await _resolveLocation();
    await refresh();
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(ApiConfig.pollInterval, (_) => refresh());
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _reconnectSub?.cancel();
    _api.dispose();
    super.dispose();
  }

  Future<void> _resolveLocation() async {
    _locationStatus = LocationStatus.requesting;
    notifyListeners();

    try {
      // Ask for permission FIRST. Checking "is location service enabled"
      // before asking for permission meant that on any phone where the
      // device's location toggle happened to be off, we returned early
      // and the OS permission dialog was never shown at all.
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        _locationStatus = LocationStatus.denied;
        notifyListeners();
        return;
      }

      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        _locationStatus = LocationStatus.serviceDisabled;
        notifyListeners();
        return;
      }

      _position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 12),
        ),
      );
      _locationStatus = LocationStatus.granted;
      notifyListeners();

      // Keep the fix reasonably fresh while the app is open, without
      // hammering the GPS chip.
      Geolocator.getPositionStream(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 200, // metres
        ),
      ).listen((pos) {
        _position = pos;
        notifyListeners();
      });
    } catch (_) {
      _locationStatus = LocationStatus.denied;
      notifyListeners();
    }
  }

  Future<void> retryLocationPermission() => _resolveLocation();

  /// Runs the fallback chain and updates state. Safe to call repeatedly
  /// (pull-to-refresh, reconnect events, the poll timer).
  Future<void> refresh({bool forceRefresh = false}) async {
    _isLoading = true;
    if (_stateRisk == null) _errorMessage = null;
    notifyListeners();

    // 1. Live backend.
    try {
      final risk = await _api.fetchStateRisk(forceRefresh: forceRefresh);
      await _commit(risk, offline: false);
      return;
    } on ApiException {
      // fall through to demo endpoint
    } catch (_) {
      // fall through to demo endpoint
    }

    // 2. Backend's own deterministic demo dataset (backend is up, live
    //    government telemetry pipeline is not).
    try {
      final demo = await _api.fetchDemoStateRisk();
      await _commit(demo, offline: false);
      return;
    } on ApiException {
      // fall through to on-device cache
    } catch (_) {
      // fall through to on-device cache
    }

    // 3. On-device cache from the last time either call succeeded.
    final cached = await _storage.loadCachedStateRisk();
    if (cached != null) {
      final (risk, syncedAt) = cached;
      _stateRisk = risk;
      _lastSyncedAt = syncedAt;
      _isUsingOfflineCache = true;
      _errorMessage = null;
      _isLoading = false;
      notifyListeners();
      return;
    }

    // 4. Truly nothing available.
    _isLoading = false;
    _errorMessage = _connectivity?.isOnline == false
        ? 'No network connection and no cached data on this device yet.'
        : 'FlashGuard backend is unreachable and no cached data exists yet.';
    notifyListeners();
  }

  Future<void> _commit(StateRisk risk, {required bool offline}) async {
    _stateRisk = risk;
    _lastSyncedAt = DateTime.now();
    _isUsingOfflineCache = offline;
    _errorMessage = null;
    _isLoading = false;
    notifyListeners();

    // Persist for offline use. We re-serialize a minimal snapshot rather
    // than keeping the original raw map, since StateRisk carries every
    // field the UI needs.
    await _storage.saveStateRisk(risk, _toJson(risk));
  }

  Map<String, dynamic> _toJson(StateRisk risk) {
    // Round-trip helper: only fields StateRisk.fromJson reads are needed.
    return jsonDecode(jsonEncode({
      'state': risk.state,
      'district_count': risk.districtCount,
      'station_count': risk.stationCount,
      'observations_used': risk.observationsUsed,
      'highest_risk': risk.highestRisk.label,
      'average_risk_score': risk.averageRiskScore,
      'maximum_risk_score': risk.maximumRiskScore,
      'high_or_critical_station_count': risk.highOrCriticalStationCount,
      'observation_time': risk.observationTime?.toIso8601String(),
      'retrieved_at': risk.retrievedAt.toIso8601String(),
      'data_age_hours': risk.dataAgeHours,
      'data_source_status': risk.dataSourceStatus.name,
      'disclaimer': risk.disclaimer,
      'districts': risk.districts
          .map((d) => {
                'district': d.district,
                'station_count': d.stationCount,
                'highest_risk': d.highestRisk.label,
                'average_risk_score': d.averageRiskScore,
                'maximum_risk_score': d.maximumRiskScore,
                'high_or_critical_station_count': d.highOrCriticalStationCount,
                'max_hourly_rainfall_mm': d.maxHourlyRainfallMm,
                'max_6h_rainfall_mm': d.max6hRainfallMm,
                'max_24h_rainfall_mm': d.max24hRainfallMm,
                'observation_time': d.observationTime?.toIso8601String(),
                'data_source_status': d.dataSourceStatus.name,
                'stations': d.stations
                    .map((s) => {
                          'station': s.station,
                          'district': s.district,
                          'latitude': s.latitude,
                          'longitude': s.longitude,
                          'hourly_rainfall_mm': s.hourlyRainfallMm,
                          'rainfall_6h_mm': s.rainfall6hMm,
                          'rainfall_24h_mm': s.rainfall24hMm,
                          'risk_score': s.riskScore,
                          'risk_level': s.riskLevel.label,
                          'reasons': s.reasons,
                          'observation_time': s.observationTime?.toIso8601String(),
                          'data_age_hours': s.dataAgeHours,
                          'data_source_status': s.dataSourceStatus.name,
                        })
                    .toList(),
              })
          .toList(),
    }));
  }
}
