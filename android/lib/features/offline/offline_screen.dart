import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../core/constants/app_constants.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/alert_provider.dart';
import '../../providers/connectivity_provider.dart';

class OfflineScreen extends StatelessWidget {
  const OfflineScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final connectivity = context.watch<ConnectivityProvider>();
    final alerts = context.watch<AlertProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('OFFLINE STATUS')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _StatusRow(
            label: 'DEVICE NETWORK',
            value: connectivity.isOnline ? 'CONNECTED' : 'NO CONNECTION',
            color: connectivity.isOnline ? AppColors.low : AppColors.critical,
          ),
          const SizedBox(height: 10),
          _StatusRow(
            label: 'DATA SOURCE',
            value: alerts.isUsingOfflineCache
                ? 'ON-DEVICE CACHE'
                : alerts.hasData
                    ? (alerts.stateRisk!.dataSourceStatus.label)
                    : 'NONE',
            color: alerts.isUsingOfflineCache
                ? AppColors.high
                : alerts.hasData
                    ? AppColors.low
                    : AppColors.critical,
          ),
          const SizedBox(height: 24),
          if (alerts.isUsingOfflineCache) ...[
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.hairline),
                borderRadius: BorderRadius.circular(3),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'SHOWING LAST SYNCED SNAPSHOT',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 0.6),
                  ),
                  const SizedBox(height: 8),
                  if (alerts.lastSyncedAt != null)
                    Text(
                      'Synced ${DateFormat('dd MMM yyyy, HH:mm').format(alerts.lastSyncedAt!.toLocal())}',
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                  const SizedBox(height: 4),
                  Text(
                    'Highest tier at last sync: ${alerts.stateRisk?.highestRisk.label ?? "—"} · '
                    '${alerts.stateRisk?.highOrCriticalStationCount ?? 0} station(s) HIGH/CRITICAL',
                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'This is not live. Numbers will not reflect anything that has '
                    'changed since the last successful sync.',
                    style: TextStyle(fontSize: 11, color: AppColors.textMuted, height: 1.4),
                  ),
                ],
              ),
            ),
          ] else if (!alerts.hasData) ...[
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.hairline),
                borderRadius: BorderRadius.circular(3),
              ),
              child: Text(
                alerts.errorMessage ??
                    'No cached data exists on this device yet — connect once to seed the offline cache.',
                style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.4),
              ),
            ),
          ] else ...[
            const Text(
              'Data is current — nothing is being served from cache right now.',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
          ],
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () => alerts.refresh(forceRefresh: true),
              child: alerts.isLoading
                  ? const SizedBox(
                      height: 16,
                      width: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('RETRY SYNC NOW'),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusRow extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _StatusRow({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 10),
        Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textMuted, letterSpacing: 0.6)),
        const Spacer(),
        Text(value, style: AppTheme.numeric(fontSize: 12, color: color)),
      ],
    );
  }
}
