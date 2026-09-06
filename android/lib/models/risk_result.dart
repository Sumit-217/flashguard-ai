import '../core/constants/app_constants.dart';

/// Mirrors `StationRiskAssessment` from `ai/src/schemas.py`.
class StationRisk {
  final String station;
  final String district;
  final double? latitude;
  final double? longitude;
  final double hourlyRainfallMm;
  final double rainfall6hMm;
  final double rainfall24hMm;
  final double riskScore;
  final RiskTier riskLevel;
  final List<String> reasons;
  final DateTime? observationTime;
  final double dataAgeHours;
  final DataOrigin dataSourceStatus;

  StationRisk({
    required this.station,
    required this.district,
    required this.latitude,
    required this.longitude,
    required this.hourlyRainfallMm,
    required this.rainfall6hMm,
    required this.rainfall24hMm,
    required this.riskScore,
    required this.riskLevel,
    required this.reasons,
    required this.observationTime,
    required this.dataAgeHours,
    required this.dataSourceStatus,
  });

  factory StationRisk.fromJson(Map<String, dynamic> json) {
    return StationRisk(
      station: json['station']?.toString() ?? 'Unknown station',
      district: json['district']?.toString() ?? 'Unknown district',
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      hourlyRainfallMm: (json['hourly_rainfall_mm'] as num?)?.toDouble() ?? 0,
      rainfall6hMm: (json['rainfall_6h_mm'] as num?)?.toDouble() ?? 0,
      rainfall24hMm: (json['rainfall_24h_mm'] as num?)?.toDouble() ?? 0,
      riskScore: (json['risk_score'] as num?)?.toDouble() ?? 0,
      riskLevel: RiskTierX.parse(json['risk_level']?.toString()),
      reasons: (json['reasons'] as List?)?.map((e) => e.toString()).toList() ?? [],
      observationTime: DateTime.tryParse(json['observation_time']?.toString() ?? ''),
      dataAgeHours: (json['data_age_hours'] as num?)?.toDouble() ?? 0,
      dataSourceStatus: DataOriginX.parse(json['data_source_status']?.toString()),
    );
  }

  bool get hasCoordinates => latitude != null && longitude != null;
}

/// Mirrors `DistrictRiskAssessment`.
class DistrictRisk {
  final String district;
  final int stationCount;
  final RiskTier highestRisk;
  final double averageRiskScore;
  final double maximumRiskScore;
  final int highOrCriticalStationCount;
  final double maxHourlyRainfallMm;
  final double max6hRainfallMm;
  final double max24hRainfallMm;
  final DateTime? observationTime;
  final DataOrigin dataSourceStatus;
  final List<StationRisk> stations;

  DistrictRisk({
    required this.district,
    required this.stationCount,
    required this.highestRisk,
    required this.averageRiskScore,
    required this.maximumRiskScore,
    required this.highOrCriticalStationCount,
    required this.maxHourlyRainfallMm,
    required this.max6hRainfallMm,
    required this.max24hRainfallMm,
    required this.observationTime,
    required this.dataSourceStatus,
    required this.stations,
  });

  factory DistrictRisk.fromJson(Map<String, dynamic> json) {
    return DistrictRisk(
      district: json['district']?.toString() ?? 'Unknown district',
      stationCount: (json['station_count'] as num?)?.toInt() ?? 0,
      highestRisk: RiskTierX.parse(json['highest_risk']?.toString()),
      averageRiskScore: (json['average_risk_score'] as num?)?.toDouble() ?? 0,
      maximumRiskScore: (json['maximum_risk_score'] as num?)?.toDouble() ?? 0,
      highOrCriticalStationCount:
          (json['high_or_critical_station_count'] as num?)?.toInt() ?? 0,
      maxHourlyRainfallMm: (json['max_hourly_rainfall_mm'] as num?)?.toDouble() ?? 0,
      max6hRainfallMm: (json['max_6h_rainfall_mm'] as num?)?.toDouble() ?? 0,
      max24hRainfallMm: (json['max_24h_rainfall_mm'] as num?)?.toDouble() ?? 0,
      observationTime: DateTime.tryParse(json['observation_time']?.toString() ?? ''),
      dataSourceStatus: DataOriginX.parse(json['data_source_status']?.toString()),
      stations: (json['stations'] as List? ?? [])
          .map((e) => StationRisk.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

/// Mirrors `UttarakhandStateRiskAssessment` — the primary payload the app
/// polls from `GET /api/v1/risk/uttarakhand` (or the `/demo/...` fallback).
class StateRisk {
  final String state;
  final int districtCount;
  final int stationCount;
  final int observationsUsed;
  final RiskTier highestRisk;
  final double averageRiskScore;
  final double maximumRiskScore;
  final int highOrCriticalStationCount;
  final DateTime? observationTime;
  final DateTime retrievedAt;
  final double? dataAgeHours;
  final DataOrigin dataSourceStatus;
  final String disclaimer;
  final List<DistrictRisk> districts;

  StateRisk({
    required this.state,
    required this.districtCount,
    required this.stationCount,
    required this.observationsUsed,
    required this.highestRisk,
    required this.averageRiskScore,
    required this.maximumRiskScore,
    required this.highOrCriticalStationCount,
    required this.observationTime,
    required this.retrievedAt,
    required this.dataAgeHours,
    required this.dataSourceStatus,
    required this.disclaimer,
    required this.districts,
  });

  factory StateRisk.fromJson(Map<String, dynamic> json) {
    return StateRisk(
      state: json['state']?.toString() ?? 'Uttarakhand',
      districtCount: (json['district_count'] as num?)?.toInt() ?? 0,
      stationCount: (json['station_count'] as num?)?.toInt() ?? 0,
      observationsUsed: (json['observations_used'] as num?)?.toInt() ?? 0,
      highestRisk: RiskTierX.parse(json['highest_risk']?.toString()),
      averageRiskScore: (json['average_risk_score'] as num?)?.toDouble() ?? 0,
      maximumRiskScore: (json['maximum_risk_score'] as num?)?.toDouble() ?? 0,
      highOrCriticalStationCount:
          (json['high_or_critical_station_count'] as num?)?.toInt() ?? 0,
      observationTime: DateTime.tryParse(json['observation_time']?.toString() ?? ''),
      retrievedAt:
          DateTime.tryParse(json['retrieved_at']?.toString() ?? '') ?? DateTime.now(),
      dataAgeHours: (json['data_age_hours'] as num?)?.toDouble(),
      dataSourceStatus: DataOriginX.parse(json['data_source_status']?.toString()),
      disclaimer: json['disclaimer']?.toString() ?? '',
      districts: (json['districts'] as List? ?? [])
          .map((e) => DistrictRisk.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  /// Flattened list of every station across every district — convenient
  /// for nearest-station lookup and for the alerts feed.
  List<StationRisk> get allStations =>
      districts.expand((d) => d.stations).toList(growable: false);
}
