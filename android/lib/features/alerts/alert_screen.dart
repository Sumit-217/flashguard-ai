import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../core/constants/app_constants.dart';
import '../../core/theme/app_theme.dart';
import '../../models/disaster_alert.dart';
import '../../providers/alert_provider.dart';

class AlertScreen extends StatelessWidget {
  const AlertScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AlertProvider>();
    final alerts = provider.activeAlerts;

    return Scaffold(
      appBar: AppBar(
        title: const Text('ACTIVE ALERTS'),
      ),
      body: RefreshIndicator(
        onRefresh: () => provider.refresh(forceRefresh: true),
        color: AppColors.accent,
        backgroundColor: AppColors.surface,
        child: !provider.hasData
            ? ListView(
                children: const [
                  SizedBox(height: 120),
                  Center(
                    child: Text('No data yet.', style: TextStyle(color: AppColors.textMuted)),
                  ),
                ],
              )
            : alerts.isEmpty
                ? _AllClearBody(stationCount: provider.stateRisk!.stationCount)
                : ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: alerts.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, i) => _AlertCard(alert: alerts[i]),
                  ),
      ),
    );
  }
}

class _AllClearBody extends StatelessWidget {
  final int stationCount;
  const _AllClearBody({required this.stationCount});

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        const SizedBox(height: 120),
        const Icon(Icons.check_circle_outline, size: 40, color: AppColors.low),
        const SizedBox(height: 14),
        const Center(
          child: Text(
            'NO HIGH OR CRITICAL STATIONS',
            style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600, letterSpacing: 0.6),
          ),
        ),
        const SizedBox(height: 6),
        Center(
          child: Text(
            'All $stationCount reporting stations are currently LOW or MODERATE.',
            style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
            textAlign: TextAlign.center,
          ),
        ),
      ],
    );
  }
}

class _AlertCard extends StatelessWidget {
  final DisasterAlert alert;
  const _AlertCard({required this.alert});

  @override
  Widget build(BuildContext context) {
    final color = AppColors.forTier(alert.riskLevel);
    final timeFmt = DateFormat('dd MMM, HH:mm');

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: color.withOpacity(0.4)),
        borderRadius: BorderRadius.circular(3),
      ),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(width: 4, color: color),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: color.withOpacity(0.12),
                            border: Border.all(color: color),
                            borderRadius: BorderRadius.circular(2),
                          ),
                          child: Text(
                            alert.riskLevel.label,
                            style: AppTheme.numeric(fontSize: 10.5, color: color, fontWeight: FontWeight.w700),
                          ),
                        ),
                        const Spacer(),
                        Text(
                          alert.riskScore.toStringAsFixed(0),
                          style: AppTheme.numeric(fontSize: 20, color: color, fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(alert.station, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                    Text(alert.district, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 14,
                      runSpacing: 4,
                      children: [
                        if (alert.distanceKm != null)
                          _Tag(icon: Icons.near_me, text: '${alert.distanceKm!.toStringAsFixed(1)} km away'),
                        _Tag(icon: Icons.water_drop_outlined, text: '${alert.rainfall24hMm.toStringAsFixed(0)}mm/24h'),
                        if (alert.observedAt != null)
                          _Tag(icon: Icons.schedule, text: timeFmt.format(alert.observedAt!.toLocal())),
                      ],
                    ),
                    if (alert.reasons.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(
                        alert.reasons.first,
                        style: const TextStyle(fontSize: 11.5, color: AppColors.textSecondary),
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

class _Tag extends StatelessWidget {
  final IconData icon;
  final String text;
  const _Tag({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 12, color: AppColors.textMuted),
        const SizedBox(width: 4),
        Text(text, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
      ],
    );
  }
}
