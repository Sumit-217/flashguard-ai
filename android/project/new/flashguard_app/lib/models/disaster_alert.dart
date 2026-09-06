import '../core/constants/app_constants.dart';
import 'risk_result.dart';

/// A single actionable alert surfaced to the user — derived client-side
/// from any station reporting HIGH or CRITICAL risk in the latest
/// [StateRisk] snapshot. Not a separate backend endpoint: the backend
/// exposes raw station/district risk, and the app decides what rises to
/// the level of an "alert" worth interrupting the user for.
class DisasterAlert {
  final String station;
  final String district;
  final RiskTier riskLevel;
  final double riskScore;
  final double rainfall24hMm;
  final DateTime? observedAt;
  final double? distanceKm;
  final List<String> reasons;

  DisasterAlert({
    required this.station,
    required this.district,
    required this.riskLevel,
    required this.riskScore,
    required this.rainfall24hMm,
    required this.observedAt,
    required this.distanceKm,
    required this.reasons,
  });

  factory DisasterAlert.fromStation(StationRisk s, {double? distanceKm}) {
    return DisasterAlert(
      station: s.station,
      district: s.district,
      riskLevel: s.riskLevel,
      riskScore: s.riskScore,
      rainfall24hMm: s.rainfall24hMm,
      observedAt: s.observationTime,
      distanceKm: distanceKm,
      reasons: s.reasons,
    );
  }

  bool get isCritical => riskLevel == RiskTier.critical;
}
