import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/constants/app_constants.dart';
import '../../core/theme/app_theme.dart';
import '../../models/shelter.dart';
import '../../providers/alert_provider.dart';

/// Ranks the four documented Uttarakhand reference locations by real
/// distance from the user's GPS fix, and cross-references each against
/// whatever live district risk data is currently loaded. See the doc
/// comment on [Shelter] for why these are fixed reference points rather
/// than a live shelter API — the backend doesn't expose one yet.
class RouteScreen extends StatelessWidget {
  const RouteScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AlertProvider>();
    final pos = provider.position;
    final risk = provider.stateRisk;

    var shelters = kReferenceLocations.map((loc) {
      final match = risk?.districts.where(
        (d) => d.district.toLowerCase() == loc.district.toLowerCase(),
      );
      final districtRisk = (match != null && match.isNotEmpty) ? match.first : null;

      double? distance;
      if (pos != null) {
        distance = haversineKm(pos.latitude, pos.longitude, loc.latitude, loc.longitude);
      }

      return Shelter(
        name: loc.name,
        district: loc.district,
        latitude: loc.latitude,
        longitude: loc.longitude,
        hazardProfile: loc.hazardProfile,
        distanceKm: distance,
        currentDistrictRisk: districtRisk?.highestRisk,
      );
    }).toList();

    shelters.sort((a, b) {
      if (a.distanceKm == null && b.distanceKm == null) return 0;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm!.compareTo(b.distanceKm!);
    });

    return Scaffold(
      appBar: AppBar(title: const Text('SAFE ROUTE')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (pos == null)
            Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.hairline),
                borderRadius: BorderRadius.circular(3),
              ),
              child: const Text(
                'Enable location to rank these by distance from you and to open '
                'turn-by-turn directions.',
                style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
            ),
          const Text(
            'REFERENCE SAFE ZONES',
            style: TextStyle(fontSize: 11, color: AppColors.textMuted, letterSpacing: 0.8),
          ),
          const SizedBox(height: 4),
          const Text(
            'Nearest known towns with disaster infrastructure, ranked by distance. '
            'Cross-checked against live district risk where available.',
            style: TextStyle(fontSize: 11.5, color: AppColors.textMuted, height: 1.4),
          ),
          const SizedBox(height: 14),
          ...shelters.map((s) => _ShelterCard(shelter: s)),
        ],
      ),
    );
  }
}

class _ShelterCard extends StatelessWidget {
  final Shelter shelter;
  const _ShelterCard({required this.shelter});

  Future<void> _openDirections() async {
    final uri = Uri.parse(
      'https://www.google.com/maps/dir/?api=1&destination=${shelter.latitude},${shelter.longitude}',
    );
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    final tier = shelter.currentDistrictRisk;
    final color = tier != null ? AppColors.forTier(tier) : AppColors.textMuted;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.hairline),
        borderRadius: BorderRadius.circular(3),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(shelter.name, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
              ),
              if (shelter.distanceKm != null)
                Text(
                  '${shelter.distanceKm!.toStringAsFixed(0)} km',
                  style: AppTheme.numeric(fontSize: 15, color: AppColors.textPrimary),
                ),
            ],
          ),
          Text(shelter.district, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
          const SizedBox(height: 6),
          Text(shelter.hazardProfile, style: const TextStyle(fontSize: 11.5, color: AppColors.textMuted)),
          const SizedBox(height: 10),
          Row(
            children: [
              Container(width: 7, height: 7, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
              const SizedBox(width: 6),
              Text(
                tier != null ? '${tier.label} DISTRICT RISK NOW' : 'NO LIVE DISTRICT DATA',
                style: TextStyle(fontSize: 10.5, color: color, letterSpacing: 0.4),
              ),
              const Spacer(),
              TextButton.icon(
                onPressed: _openDirections,
                icon: const Icon(Icons.directions, size: 16),
                label: const Text('DIRECTIONS'),
                style: TextButton.styleFrom(
                  foregroundColor: AppColors.accent,
                  padding: EdgeInsets.zero,
                  minimumSize: const Size(0, 0),
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
