/// App-wide constants: backend configuration, risk-tier vocabulary and the
/// fixed set of demo/reference locations documented in
/// `docs/demo/api-contract.md` of the FlashGuard AI backend.
library;

import 'dart:math' as math;

/// Great-circle distance between two WGS84 points, in kilometres.
/// Used to rank telemetry stations and reference towns by real distance
/// from the user's live GPS fix.
double haversineKm(double lat1, double lon1, double lat2, double lon2) {
  const earthRadiusKm = 6371.0;
  final dLat = _toRad(lat2 - lat1);
  final dLon = _toRad(lon2 - lon1);
  final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
      math.cos(_toRad(lat1)) *
          math.cos(_toRad(lat2)) *
          math.sin(dLon / 2) *
          math.sin(dLon / 2);
  final c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
  return earthRadiusKm * c;
}

double _toRad(double deg) => deg * math.pi / 180.0;

class ApiConfig {
  ApiConfig._();

  /// Base URL of the FlashGuard AI FastAPI backend.
  ///
  /// - Android emulator talking to a backend running on your dev machine:
  ///   `http://10.0.2.2:8000` (10.0.2.2 is the emulator's alias for the host
  ///   machine's localhost — plain `localhost` will NOT reach your laptop).
  /// - Physical device on the same Wi-Fi as your dev machine:
  ///   `http://<your-machine-lan-ip>:8000`
  /// - Deployed backend (e.g. Render): the public HTTPS URL, e.g.
  ///   `https://flashguard-backend.onrender.com`
  ///
  /// Change this one line to point the whole app at a different backend.
  static const String baseUrl = String.fromEnvironment(
    'FLASHGUARD_API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8000',
  );

  static const String apiV1 = '$baseUrl/api/v1';

  static const Duration requestTimeout = Duration(seconds: 15);

  /// How often the dashboard silently re-polls the backend while open.
  static const Duration pollInterval = Duration(seconds: 90);

  // Endpoints -----------------------------------------------------------
  static const String health = '$baseUrl/health';
  static const String stateRisk = '$apiV1/risk/uttarakhand';
  static const String demoStateRisk = '$apiV1/demo/risk/uttarakhand';
  static const String rainfallSummary = '$apiV1/rainfall/uttarakhand';
  static const String demoScenarioAssessment = '$apiV1/demo/risk-assessment';

  static String districtRisk(String district) =>
      '$apiV1/risk/district/${Uri.encodeComponent(district)}';

  static String stationRisk(String station) =>
      '$apiV1/risk/station/${Uri.encodeComponent(station)}';
}

/// Configuration for the separate admin/rescue-coordination backend that
/// receives profile + live-location reports and SOS ("ask for help")
/// requests. This is intentionally kept separate from [ApiConfig] (the
/// FlashGuard AI risk backend) since it may end up being a different
/// service/host.
///
/// TODO: fill in [baseUrl] once the admin endpoint is available. Nothing
/// is sent anywhere until this is a real URL — see [ApiConfig.isConfigured]
/// call sites in ApiService, which no-op with a clear error otherwise.
class AdminApiConfig {
  AdminApiConfig._();

  static const String baseUrl = String.fromEnvironment(
    'FLASHGUARD_ADMIN_BASE_URL',
    defaultValue: '', // e.g. 'https://admin.flashguard.example.com'
  );

  static bool get isConfigured => baseUrl.trim().isNotEmpty;

  /// Expects: { name, phone, aadhaar_number, emergency_contact_name,
  ///            emergency_contact_phone, latitude, longitude,
  ///            accuracy_m, recorded_at }
  static String get locationPing => '$baseUrl/api/v1/location/ping';

  /// Expects the same profile fields as [locationPing] plus a free-text
  /// `message`. Meant for the one-off "ASK FOR HELP" button rather than
  /// the periodic background ping.
  static String get sosAlert => '$baseUrl/api/v1/sos/alert';

  /// How often the profile/location ping is sent while sharing is
  /// switched on in the Profile screen.
  static const Duration locationPingInterval = Duration(seconds: 5);
}

/// Local cache keys.
class StorageKeys {
  StorageKeys._();

  static const String lastStateRiskJson = 'cache.state_risk.json';
  static const String lastSyncedAtIso = 'cache.state_risk.synced_at';
}

/// Canonical risk tiers used across the app. The backend uses two slightly
/// different vocabularies (`MEDIUM` from the scenario-demo endpoint vs.
/// `MODERATE` from the live telemetry endpoints) — [RiskTier.parse]
/// normalizes both onto the same four tiers.
enum RiskTier { low, moderate, high, critical, unknown }

extension RiskTierX on RiskTier {
  static RiskTier parse(String? raw) {
    switch ((raw ?? '').trim().toUpperCase()) {
      case 'LOW':
        return RiskTier.low;
      case 'MEDIUM':
      case 'MODERATE':
        return RiskTier.moderate;
      case 'HIGH':
        return RiskTier.high;
      case 'CRITICAL':
        return RiskTier.critical;
      default:
        return RiskTier.unknown;
    }
  }

  String get label {
    switch (this) {
      case RiskTier.low:
        return 'LOW';
      case RiskTier.moderate:
        return 'MODERATE';
      case RiskTier.high:
        return 'HIGH';
      case RiskTier.critical:
        return 'CRITICAL';
      case RiskTier.unknown:
        return '—';
    }
  }
}

/// Source of the currently-displayed data, mirrors the backend's
/// `data_source_status` field plus a couple of client-only states.
enum DataOrigin { live, cached, demo, unavailable, offlineCache, unknown }

extension DataOriginX on DataOrigin {
  static DataOrigin parse(String? raw) {
    switch ((raw ?? '').trim().toLowerCase()) {
      case 'live':
        return DataOrigin.live;
      case 'cached':
        return DataOrigin.cached;
      case 'demo':
        return DataOrigin.demo;
      case 'unavailable':
        return DataOrigin.unavailable;
      default:
        return DataOrigin.unknown;
    }
  }

  String get label {
    switch (this) {
      case DataOrigin.live:
        return 'LIVE';
      case DataOrigin.cached:
        return 'BACKEND CACHE';
      case DataOrigin.demo:
        return 'DEMO DATA';
      case DataOrigin.unavailable:
        return 'UNAVAILABLE';
      case DataOrigin.offlineCache:
        return 'LAST SYNCED (OFFLINE)';
      case DataOrigin.unknown:
        return 'UNKNOWN';
    }
  }
}

/// The four Uttarakhand reference locations frozen in the demo API
/// contract. Used for the scenario picker and as anchor points on the
/// route/safe-zone screen when no closer live station is available.
class ReferenceLocation {
  final String name;
  final String district;
  final double latitude;
  final double longitude;
  final String hazardProfile;

  const ReferenceLocation({
    required this.name,
    required this.district,
    required this.latitude,
    required this.longitude,
    required this.hazardProfile,
  });
}

const List<ReferenceLocation> kReferenceLocations = [
  ReferenceLocation(
    name: 'Joshimath',
    district: 'Chamoli',
    latitude: 30.5564,
    longitude: 79.5678,
    hazardProfile: 'Flash flood · GLOF · land subsidence',
  ),
  ReferenceLocation(
    name: 'Kedarnath / Gaurikund',
    district: 'Rudraprayag',
    latitude: 30.7346,
    longitude: 79.0669,
    hazardProfile: 'Cloudburst · flash flood',
  ),
  ReferenceLocation(
    name: 'Dharasu',
    district: 'Uttarkashi',
    latitude: 30.6322,
    longitude: 78.3186,
    hazardProfile: 'Landslide · debris flow',
  ),
  ReferenceLocation(
    name: 'Rishikesh',
    district: 'Dehradun',
    latitude: 30.0869,
    longitude: 78.2676,
    hazardProfile: 'Downstream river surge',
  ),
];

const List<String> kDemoDisasterTypes = [
  'flood',
  'landslide',
  'cloudburst',
  'earthquake',
];
