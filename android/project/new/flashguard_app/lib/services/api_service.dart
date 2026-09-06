import '../core/constants/app_constants.dart';
import '../core/network/api_client.dart';
import '../models/risk_result.dart';
import '../models/user_profile.dart';

/// Typed access to the FlashGuard AI backend
/// (`Sumit-217/flashguard-ai`, `feature/demo-backend-risk`).
///
/// Endpoint reference (see `backend/README.md` / `ai/src/api/routes.py`):
///   GET  /health
///   GET  /api/v1/risk/uttarakhand              — live state-wide risk (primary)
///   GET  /api/v1/demo/risk/uttarakhand         — deterministic fallback
///   GET  /api/v1/risk/district/{district}
///   GET  /api/v1/risk/station/{station}
///   GET  /api/v1/rainfall/uttarakhand
///   POST /api/v1/demo/risk-assessment          — Joshimath-style scenario input
class ApiService {
  final ApiClient _client;

  ApiService({ApiClient? client}) : _client = client ?? ApiClient();

  Future<bool> isBackendHealthy() async {
    try {
      final json = await _client.getJson(ApiConfig.health);
      return json['status']?.toString().toLowerCase() == 'healthy';
    } catch (_) {
      return false;
    }
  }

  /// Primary dashboard call: full live risk picture for every reporting
  /// district/station in Uttarakhand, aggregated from real NWDP telemetry.
  Future<StateRisk> fetchStateRisk({bool forceRefresh = false}) async {
    final url = forceRefresh ? '${ApiConfig.stateRisk}?force_refresh=true' : ApiConfig.stateRisk;
    final json = await _client.getJson(url);
    return StateRisk.fromJson(json);
  }

  /// Deterministic fallback dataset — used when the live NWDP pipeline is
  /// unreachable but the backend itself is up. Exercises all four tiers.
  Future<StateRisk> fetchDemoStateRisk() async {
    final json = await _client.getJson(ApiConfig.demoStateRisk);
    return StateRisk.fromJson(json);
  }

  Future<DistrictRisk> fetchDistrictRisk(String district, {bool forceRefresh = false}) async {
    final base = ApiConfig.districtRisk(district);
    final url = forceRefresh ? '$base?force_refresh=true' : base;
    final json = await _client.getJson(url);
    return DistrictRisk.fromJson(json);
  }

  Future<StationRisk> fetchStationRisk(String station, {bool forceRefresh = false}) async {
    final base = ApiConfig.stationRisk(station);
    final url = forceRefresh ? '$base?force_refresh=true' : base;
    final json = await _client.getJson(url);
    return StationRisk.fromJson(json);
  }

  /// Raw ingested telemetry summary (district/station counts, sample rows).
  Future<Map<String, dynamic>> fetchRainfallSummary({bool forceRefresh = false}) async {
    final url =
        forceRefresh ? '${ApiConfig.rainfallSummary}?force_refresh=true' : ApiConfig.rainfallSummary;
    return _client.getJson(url);
  }

  /// The frozen director-demo contract: manual scenario input
  /// (disaster_type / location / rainfall / water_level / historical_risk)
  /// -> composite risk_score + risk_level + alert flag.
  Future<Map<String, dynamic>> assessScenario({
    required String disasterType,
    required String location,
    required double rainfall,
    required double waterLevel,
    required double historicalRisk,
  }) {
    return _client.postJson(ApiConfig.demoScenarioAssessment, {
      'disaster_type': disasterType,
      'location': location,
      'rainfall': rainfall,
      'water_level': waterLevel,
      'historical_risk': historicalRisk,
    });
  }

  /// Sends one profile + location sample to the admin/rescue backend.
  /// Throws [ApiException] on failure (caller decides how to surface it —
  /// see [LocationReportingService], which swallows individual ping
  /// failures rather than crashing a background timer).
  Future<void> sendLocationPing({
    required UserProfile profile,
    required double latitude,
    required double longitude,
    required double accuracyMeters,
  }) async {
    if (!AdminApiConfig.isConfigured) {
      throw ApiException(
        'Admin server URL is not configured yet (AdminApiConfig.baseUrl).',
      );
    }
    await _client.postJson(AdminApiConfig.locationPing, {
      'name': profile.name,
      'phone': profile.phone,
      'aadhaar_number': profile.aadhaarNumber,
      'emergency_contact_name': profile.emergencyContactName,
      'emergency_contact_phone': profile.emergencyContactPhone,
      'latitude': latitude,
      'longitude': longitude,
      'accuracy_m': accuracyMeters,
      'recorded_at': DateTime.now().toUtc().toIso8601String(),
    });
  }

  /// One-off SOS / "ask for help" request — same payload shape as the
  /// location ping, plus an optional free-text message.
  Future<void> sendHelpRequest({
    required UserProfile profile,
    required double latitude,
    required double longitude,
    required double accuracyMeters,
    String message = 'SOS: user requested help from FlashGuard app.',
  }) async {
    if (!AdminApiConfig.isConfigured) {
      throw ApiException(
        'Admin server URL is not configured yet (AdminApiConfig.baseUrl).',
      );
    }
    await _client.postJson(AdminApiConfig.sosAlert, {
      'name': profile.name,
      'phone': profile.phone,
      'aadhaar_number': profile.aadhaarNumber,
      'emergency_contact_name': profile.emergencyContactName,
      'emergency_contact_phone': profile.emergencyContactPhone,
      'latitude': latitude,
      'longitude': longitude,
      'accuracy_m': accuracyMeters,
      'message': message,
      'recorded_at': DateTime.now().toUtc().toIso8601String(),
    });
  }

  void dispose() => _client.dispose();
}
