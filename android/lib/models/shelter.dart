import '../core/constants/app_constants.dart';

/// A reference safe-zone / evacuation anchor point.
///
/// NOTE ON DATA SOURCE: the FlashGuard backend does not yet expose a
/// shelter/evacuation-point API (see backend README "Target / Planned
/// Architecture" — PostGIS-backed shelter storage is future scope). Until
/// that endpoint exists, this screen anchors on the four Uttarakhand
/// reference towns frozen in `docs/demo/api-contract.md`, cross-referenced
/// against whatever *live* district risk data is available, and ranked by
/// real GPS distance from the user. This keeps the feature honest about
/// what is live telemetry vs. a fixed reference point.
class Shelter {
  final String name;
  final String district;
  final double latitude;
  final double longitude;
  final String hazardProfile;
  final double? distanceKm;
  final RiskTier? currentDistrictRisk;

  Shelter({
    required this.name,
    required this.district,
    required this.latitude,
    required this.longitude,
    required this.hazardProfile,
    this.distanceKm,
    this.currentDistrictRisk,
  });

  Shelter copyWith({double? distanceKm, RiskTier? currentDistrictRisk}) {
    return Shelter(
      name: name,
      district: district,
      latitude: latitude,
      longitude: longitude,
      hazardProfile: hazardProfile,
      distanceKm: distanceKm ?? this.distanceKm,
      currentDistrictRisk: currentDistrictRisk ?? this.currentDistrictRisk,
    );
  }
}
