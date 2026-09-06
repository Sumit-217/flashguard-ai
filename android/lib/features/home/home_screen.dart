import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../core/constants/app_constants.dart';
import '../../core/theme/app_theme.dart';
import '../../models/risk_result.dart';
import '../../providers/alert_provider.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AlertProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('FLASHGUARD'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Center(child: _StatusChip(provider: provider)),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => provider.refresh(forceRefresh: true),
        color: AppColors.accent,
        backgroundColor: AppColors.surface,
        child: !provider.hasData
            ? (provider.isFullyOffline
                ? _NoDataBody(provider: provider)
                : const _LoadingBody())
            : _DashboardBody(provider: provider),
      ),
    );
  }
}

class _LoadingBody extends StatelessWidget {
  const _LoadingBody();

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: const [
        SizedBox(height: 160),
        Center(child: CircularProgressIndicator()),
        SizedBox(height: 16),
        Center(
          child: Text(
            'ACQUIRING GPS FIX & TELEMETRY…',
            style: TextStyle(color: AppColors.textMuted, letterSpacing: 1.0),
          ),
        ),
      ],
    );
  }
}

class _NoDataBody extends StatelessWidget {
  final AlertProvider provider;
  const _NoDataBody({required this.provider});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const SizedBox(height: 80),
        const Icon(Icons.satellite_alt_outlined, size: 40, color: AppColors.textMuted),
        const SizedBox(height: 16),
        Text(
          provider.errorMessage ?? 'No data available.',
          textAlign: TextAlign.center,
          style: const TextStyle(color: AppColors.textSecondary),
        ),
        const SizedBox(height: 20),
        Center(
          child: OutlinedButton(
            onPressed: () => provider.refresh(forceRefresh: true),
            child: const Text('RETRY'),
          ),
        ),
      ],
    );
  }
}

class _StatusChip extends StatelessWidget {
  final AlertProvider provider;
  const _StatusChip({required this.provider});

  @override
  Widget build(BuildContext context) {
    final origin = provider.isUsingOfflineCache
        ? DataOrigin.offlineCache
        : provider.stateRisk?.dataSourceStatus ?? DataOrigin.unknown;

    final color = switch (origin) {
      DataOrigin.live => AppColors.low,
      DataOrigin.cached => AppColors.moderate,
      DataOrigin.demo => AppColors.accent,
      DataOrigin.offlineCache => AppColors.high,
      _ => AppColors.textMuted,
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        border: Border.all(color: color.withOpacity(0.6)),
        borderRadius: BorderRadius.circular(3),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 6),
          Text(
            origin.label,
            style: AppTheme.numeric(fontSize: 10, color: color, letterSpacing: 0.6),
          ),
        ],
      ),
    );
  }
}

class _DashboardBody extends StatelessWidget {
  final AlertProvider provider;
  const _DashboardBody({required this.provider});

  @override
  Widget build(BuildContext context) {
    final risk = provider.stateRisk!;
    final nearest = provider.nearestStation;

    final tierCounts = <RiskTier, int>{
      RiskTier.low: 0,
      RiskTier.moderate: 0,
      RiskTier.high: 0,
      RiskTier.critical: 0,
    };
    for (final s in risk.allStations) {
      tierCounts[s.riskLevel] = (tierCounts[s.riskLevel] ?? 0) + 1;
    }

    final sortedDistricts = [...risk.districts]
      ..sort((a, b) => b.maximumRiskScore.compareTo(a.maximumRiskScore));

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      children: [
        _LocationRow(provider: provider),
        const SizedBox(height: 12),
        if (nearest != null)
          _NearestStationPanel(station: nearest.$1, distanceKm: nearest.$2)
        else
          _StateSummaryPanel(risk: risk),
        const SizedBox(height: 16),
        _TierCountStrip(counts: tierCounts),
        const SizedBox(height: 20),
        Text(
          'DISTRICTS · ${risk.districtCount}  ·  STATIONS · ${risk.stationCount}',
          style: AppTheme.numeric(fontSize: 11, color: AppColors.textMuted, letterSpacing: 0.8),
        ),
        const SizedBox(height: 8),
        ...sortedDistricts.map((d) => _DistrictRow(district: d)),
        const SizedBox(height: 20),
        _FooterInfo(risk: risk, syncedAt: provider.lastSyncedAt),
      ],
    );
  }
}

class _LocationRow extends StatelessWidget {
  final AlertProvider provider;
  const _LocationRow({required this.provider});

  @override
  Widget build(BuildContext context) {
    final pos = provider.position;
    String text;
    IconData icon = Icons.gps_fixed;
    VoidCallback? onTap;

    switch (provider.locationStatus) {
      case LocationStatus.granted:
        text = pos != null
            ? '${pos.latitude.toStringAsFixed(4)}, ${pos.longitude.toStringAsFixed(4)}'
            : 'Fix acquired';
        break;
      case LocationStatus.requesting:
      case LocationStatus.unknown:
        text = 'Locating…';
        icon = Icons.gps_not_fixed;
        break;
      case LocationStatus.denied:
        text = 'Location permission denied — tap to retry';
        icon = Icons.location_disabled;
        onTap = provider.retryLocationPermission;
        break;
      case LocationStatus.serviceDisabled:
        text = 'Device location is off — tap to retry';
        icon = Icons.location_off_outlined;
        onTap = provider.retryLocationPermission;
        break;
    }

    return InkWell(
      onTap: onTap,
      child: Row(
        children: [
          Icon(icon, size: 14, color: AppColors.textMuted),
          const SizedBox(width: 6),
          Text(
            text,
            style: AppTheme.numeric(fontSize: 11, color: AppColors.textMuted),
          ),
        ],
      ),
    );
  }
}

class _NearestStationPanel extends StatelessWidget {
  final StationRisk station;
  final double distanceKm;

  const _NearestStationPanel({required this.station, required this.distanceKm});

  @override
  Widget build(BuildContext context) {
    final color = AppColors.forTier(station.riskLevel);
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.hairline),
        borderRadius: BorderRadius.circular(3),
      ),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(width: 4, color: color),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'NEAREST STATION · ${distanceKm.toStringAsFixed(1)} KM AWAY',
                      style: AppTheme.numeric(
                        fontSize: 10,
                        color: AppColors.textMuted,
                        letterSpacing: 0.8,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      station.station,
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    Text(
                      station.district,
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 14),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          station.riskScore.toStringAsFixed(0),
                          style: AppTheme.numeric(fontSize: 44, color: color, fontWeight: FontWeight.w700),
                        ),
                        const Padding(
                          padding: EdgeInsets.only(left: 4, bottom: 8),
                          child: Text('/100', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                        ),
                        const Spacer(),
                        Container(
                          margin: const EdgeInsets.only(bottom: 6),
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: color.withOpacity(0.12),
                            border: Border.all(color: color),
                            borderRadius: BorderRadius.circular(2),
                          ),
                          child: Text(
                            station.riskLevel.label,
                            style: AppTheme.numeric(fontSize: 12, color: color, fontWeight: FontWeight.w700),
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 24),
                    Row(
                      children: [
                        _MetricCell(label: '1H RAIN', value: '${station.hourlyRainfallMm.toStringAsFixed(0)}mm'),
                        _MetricCell(label: '6H RAIN', value: '${station.rainfall6hMm.toStringAsFixed(0)}mm'),
                        _MetricCell(label: '24H RAIN', value: '${station.rainfall24hMm.toStringAsFixed(0)}mm'),
                      ],
                    ),
                    if (station.reasons.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      ...station.reasons.take(3).map(
                            (r) => Padding(
                              padding: const EdgeInsets.only(top: 2),
                              child: Text(
                                '· $r',
                                style: const TextStyle(fontSize: 11.5, color: AppColors.textSecondary),
                              ),
                            ),
                          ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StateSummaryPanel extends StatelessWidget {
  final StateRisk risk;
  const _StateSummaryPanel({required this.risk});

  @override
  Widget build(BuildContext context) {
    final color = AppColors.forTier(risk.highestRisk);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.hairline),
        borderRadius: BorderRadius.circular(3),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'NO GPS-MATCHED STATION NEARBY — STATE OVERVIEW',
            style: TextStyle(fontSize: 10, color: AppColors.textMuted, letterSpacing: 0.8),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Text(
                risk.highestRisk.label,
                style: AppTheme.numeric(fontSize: 28, color: color, fontWeight: FontWeight.w700),
              ),
              const SizedBox(width: 10),
              Text(
                'peak across ${risk.stationCount} stations',
                style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MetricCell extends StatelessWidget {
  final String label;
  final String value;
  const _MetricCell({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 9.5, color: AppColors.textMuted, letterSpacing: 0.5)),
          const SizedBox(height: 2),
          Text(value, style: AppTheme.numeric(fontSize: 14)),
        ],
      ),
    );
  }
}

class _TierCountStrip extends StatelessWidget {
  final Map<RiskTier, int> counts;
  const _TierCountStrip({required this.counts});

  @override
  Widget build(BuildContext context) {
    final tiers = [RiskTier.low, RiskTier.moderate, RiskTier.high, RiskTier.critical];
    return Row(
      children: tiers.map((t) {
        final color = AppColors.forTier(t);
        return Expanded(
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 3),
            padding: const EdgeInsets.symmetric(vertical: 10),
            decoration: BoxDecoration(
              border: Border(top: BorderSide(color: color, width: 2)),
            ),
            child: Column(
              children: [
                Text('${counts[t] ?? 0}', style: AppTheme.numeric(fontSize: 18, color: color)),
                const SizedBox(height: 2),
                Text(t.label, style: const TextStyle(fontSize: 9, color: AppColors.textMuted, letterSpacing: 0.4)),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _DistrictRow extends StatelessWidget {
  final DistrictRisk district;
  const _DistrictRow({required this.district});

  @override
  Widget build(BuildContext context) {
    final color = AppColors.forTier(district.highestRisk);
    return InkWell(
      onTap: () => _showDistrictSheet(context, district),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: AppColors.hairline)),
        ),
        child: Row(
          children: [
            Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
            const SizedBox(width: 10),
            Expanded(
              child: Text(district.district, style: const TextStyle(fontSize: 13.5)),
            ),
            Text(
              '${district.stationCount} stn',
              style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
            ),
            const SizedBox(width: 12),
            Text(
              district.maximumRiskScore.toStringAsFixed(0),
              style: AppTheme.numeric(fontSize: 14, color: color),
            ),
          ],
        ),
      ),
    );
  }
}

void _showDistrictSheet(BuildContext context, DistrictRisk district) {
  showModalBottomSheet(
    context: context,
    backgroundColor: AppColors.surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(8)),
    ),
    builder: (_) {
      final sorted = [...district.stations]..sort((a, b) => b.riskScore.compareTo(a.riskScore));
      return DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.6,
        builder: (context, scrollController) => ListView(
          controller: scrollController,
          padding: const EdgeInsets.all(20),
          children: [
            Text(
              district.district.toUpperCase(),
              style: AppTheme.numeric(fontSize: 15, letterSpacing: 0.8),
            ),
            const SizedBox(height: 4),
            Text(
              '${district.stationCount} reporting stations',
              style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
            ),
            const Divider(height: 24, color: AppColors.hairline),
            ...sorted.map((s) {
              final color = AppColors.forTier(s.riskLevel);
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Row(
                  children: [
                    Container(width: 4, height: 32, color: color),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(s.station, style: const TextStyle(fontSize: 13.5)),
                          Text(
                            '24h rain ${s.rainfall24hMm.toStringAsFixed(0)}mm',
                            style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                          ),
                        ],
                      ),
                    ),
                    Text(s.riskScore.toStringAsFixed(0), style: AppTheme.numeric(fontSize: 15, color: color)),
                  ],
                ),
              );
            }),
          ],
        ),
      );
    },
  );
}

class _FooterInfo extends StatelessWidget {
  final StateRisk risk;
  final DateTime? syncedAt;
  const _FooterInfo({required this.risk, required this.syncedAt});

  @override
  Widget build(BuildContext context) {
    final fmt = DateFormat('HH:mm:ss');
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (syncedAt != null)
          Text(
            'Last synced ${fmt.format(syncedAt!.toLocal())}',
            style: const TextStyle(fontSize: 10.5, color: AppColors.textMuted),
          ),
        if (risk.disclaimer.isNotEmpty) ...[
          const SizedBox(height: 6),
          Text(
            risk.disclaimer,
            style: const TextStyle(fontSize: 10, color: AppColors.textMuted, height: 1.4),
          ),
        ],
      ],
    );
  }
}
