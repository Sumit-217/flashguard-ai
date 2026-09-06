import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart' as ll;
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/constants/app_constants.dart';
import '../../core/theme/app_theme.dart';
import '../../models/risk_result.dart';
import '../../models/shelter.dart';
import '../../providers/alert_provider.dart';

/// The backend's `risk_score` is a 0–100 figure but it doesn't publish
/// the exact cut points for each qualitative tier. These bands reuse the
/// same LOW < MODERATE < HIGH < CRITICAL ordering already shown
/// elsewhere in the app (dashboard, alerts) so the map's colouring stays
/// consistent with the rest of FlashGuard; they're an approximation, not
/// a value taken from the API.
RiskTier _tierForScore(double score) {
  if (score >= 75) return RiskTier.critical;
  if (score >= 50) return RiskTier.high;
  if (score >= 25) return RiskTier.moderate;
  return RiskTier.low;
}

/// One cell of the on-screen risk-zone grid. `score`/`tier` are null when
/// no telemetry station is close enough to this patch of map for an
/// estimate to mean anything — those cells are left transparent rather
/// than guessing a colour.
class _GridCell {
  final ll.LatLng sw;
  final ll.LatLng ne;
  final double? score;
  final RiskTier tier;

  _GridCell({required this.sw, required this.ne, required this.score, required this.tier});
}

/// RISK MAP tab: a pannable map centred on the user's GPS fix with a
/// coloured risk-zone overlay (red/orange/yellow/green, interpolated
/// from the same live station risk scores used elsewhere in the app)
/// plus the nearest known safe places. The zone overlay recomputes
/// whenever the visible area changes, so panning/zooming re-assesses
/// whatever patch of the map is on screen.
class RiskMapScreen extends StatefulWidget {
  const RiskMapScreen({super.key});

  @override
  State<RiskMapScreen> createState() => _RiskMapScreenState();
}

class _RiskMapScreenState extends State<RiskMapScreen> {
  final MapController _mapController = MapController();
  List<_GridCell> _cells = [];
  bool _didInitialCenter = false;

  static const ll.LatLng _fallbackCenter = ll.LatLng(30.3, 79.0); // Uttarakhand

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AlertProvider>();
    final pos = provider.position;
    final stations =
        provider.stateRisk?.allStations.where((s) => s.hasCoordinates).toList() ?? <StationRisk>[];

    // Once a GPS fix arrives, snap the map to it a single time (the user
    // is free to pan away afterwards; we don't fight that).
    if (!_didInitialCenter && pos != null) {
      _didInitialCenter = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _mapController.move(ll.LatLng(pos.latitude, pos.longitude), 12);
      });
    }

    final userLatLng = pos != null ? ll.LatLng(pos.latitude, pos.longitude) : null;
    final safePlaces = _rankedSafePlaces(pos);

    return Scaffold(
      appBar: AppBar(title: const Text('RISK MAP')),
      body: Column(
        children: [
          if (provider.locationStatus == LocationStatus.denied ||
              provider.locationStatus == LocationStatus.serviceDisabled)
            _PermissionBanner(provider: provider),
          Expanded(
            flex: 3,
            child: Stack(
              children: [
                FlutterMap(
                  mapController: _mapController,
                  options: MapOptions(
                    initialCenter: userLatLng ?? _fallbackCenter,
                    initialZoom: userLatLng != null ? 12 : 7.5,
                    onMapReady: () => _recomputeGrid(stations),
                    onMapEvent: (event) {
                      if (event is MapEventMoveEnd ||
                          event is MapEventFlingAnimationEnd ||
                          event is MapEventDoubleTapZoomEnd ||
                          event is MapEventScrollWheelZoom) {
                        _recomputeGrid(stations);
                      }
                    },
                  ),
                  children: [
                    TileLayer(
                      urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'com.flashguard.flashguard_app',
                    ),
                    PolygonLayer(
                      polygons: _cells
                          .where((c) => c.tier != RiskTier.unknown)
                          .map(
                            (c) => Polygon(
                              points: [
                                ll.LatLng(c.sw.latitude, c.sw.longitude),
                                ll.LatLng(c.sw.latitude, c.ne.longitude),
                                ll.LatLng(c.ne.latitude, c.ne.longitude),
                                ll.LatLng(c.ne.latitude, c.sw.longitude),
                              ],
                              color: AppColors.forTier(c.tier).withOpacity(0.30),
                              borderColor: AppColors.forTier(c.tier).withOpacity(0.55),
                              borderStrokeWidth: 0.6,
                            ),
                          )
                          .toList(),
                    ),
                    CircleLayer(
                      circles: stations
                          .map(
                            (s) => CircleMarker(
                              point: ll.LatLng(s.latitude!, s.longitude!),
                              radius: 5,
                              color: AppColors.forTier(s.riskLevel),
                              borderColor: AppColors.background,
                              borderStrokeWidth: 1.5,
                            ),
                          )
                          .toList(),
                    ),
                    MarkerLayer(
                      markers: [
                        for (final s in safePlaces)
                          Marker(
                            point: ll.LatLng(s.latitude, s.longitude),
                            width: 34,
                            height: 34,
                            child: GestureDetector(
                              onTap: () => _showSafePlaceSheet(context, s),
                              child: const Icon(Icons.shield, color: AppColors.low, size: 26),
                            ),
                          ),
                        if (userLatLng != null)
                          Marker(
                            point: userLatLng,
                            width: 42,
                            height: 42,
                            child: const Icon(Icons.my_location, color: AppColors.accent, size: 30),
                          ),
                      ],
                    ),
                  ],
                ),
                const Positioned(left: 10, top: 10, child: _Legend()),
                Positioned(
                  right: 10,
                  bottom: 10,
                  child: FloatingActionButton.small(
                    heroTag: 'recenter',
                    backgroundColor: AppColors.surfaceRaised,
                    foregroundColor: AppColors.accent,
                    onPressed: userLatLng == null
                        ? provider.retryLocationPermission
                        : () {
                            _mapController.move(userLatLng, 13);
                            _recomputeGrid(stations);
                          },
                    child: Icon(userLatLng == null ? Icons.location_searching : Icons.my_location),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(
            flex: 2,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(14, 12, 14, 20),
              children: [
                const Text(
                  'SAFE PLACES NEAR YOU',
                  style: TextStyle(fontSize: 11, color: AppColors.textMuted, letterSpacing: 0.8),
                ),
                const SizedBox(height: 4),
                Text(
                  userLatLng == null
                      ? 'Enable location to rank these by real distance from you.'
                      : 'Ranked by straight-line distance from your current GPS fix. '
                          'Tap a card to jump the map there, or the pin for details.',
                  style: const TextStyle(fontSize: 11, color: AppColors.textMuted, height: 1.3),
                ),
                const SizedBox(height: 10),
                ...safePlaces.map(
                  (s) => _SafePlaceRow(
                    shelter: s,
                    onTapMap: () => _mapController.move(ll.LatLng(s.latitude, s.longitude), 12),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  List<Shelter> _rankedSafePlaces(Position? pos) {
    final list = kReferenceLocations.map((loc) {
      final distance =
          pos != null ? haversineKm(pos.latitude, pos.longitude, loc.latitude, loc.longitude) : null;
      return Shelter(
        name: loc.name,
        district: loc.district,
        latitude: loc.latitude,
        longitude: loc.longitude,
        hazardProfile: loc.hazardProfile,
        distanceKm: distance,
      );
    }).toList();

    list.sort((a, b) {
      if (a.distanceKm == null && b.distanceKm == null) return 0;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm!.compareTo(b.distanceKm!);
    });
    return list;
  }

  void _recomputeGrid(List<StationRisk> stations) {
    late final LatLngBounds bounds;
    try {
      bounds = _mapController.camera.visibleBounds;
    } catch (_) {
      return; // map not laid out yet
    }
    final cells = _buildGrid(bounds, stations);
    if (!mounted) return;
    setState(() => _cells = cells);
  }

  /// Splits the current viewport into an 8x8 grid and estimates a risk
  /// score for each cell via inverse-distance weighting over live
  /// station readings — the same `risk_score` values shown on the
  /// dashboard and alerts tabs, just interpolated spatially so the map
  /// can shade whole areas rather than single points. A cell is only
  /// coloured if a station is within 150km, so far-off, uncovered parts
  /// of the map are left blank instead of showing an invented value.
  List<_GridCell> _buildGrid(LatLngBounds bounds, List<StationRisk> stations) {
    const rows = 8;
    const cols = 8;
    final latSpan = bounds.north - bounds.south;
    final lngSpan = bounds.east - bounds.west;
    if (latSpan <= 0 || lngSpan <= 0) return [];
    final cellLat = latSpan / rows;
    final cellLng = lngSpan / cols;

    final cells = <_GridCell>[];
    for (var r = 0; r < rows; r++) {
      final south = bounds.south + r * cellLat;
      final north = south + cellLat;
      for (var c = 0; c < cols; c++) {
        final west = bounds.west + c * cellLng;
        final east = west + cellLng;
        final centerLat = (south + north) / 2;
        final centerLng = (west + east) / 2;

        double weightedSum = 0;
        double weightTotal = 0;
        double nearestKm = double.infinity;
        for (final s in stations) {
          final d = haversineKm(centerLat, centerLng, s.latitude!, s.longitude!);
          if (d < nearestKm) nearestKm = d;
          final w = 1 / (d * d + 4.0);
          weightedSum += w * s.riskScore;
          weightTotal += w;
        }

        double? score;
        if (stations.isNotEmpty && nearestKm <= 150) {
          score = weightedSum / weightTotal;
        }

        cells.add(
          _GridCell(
            sw: ll.LatLng(south, west),
            ne: ll.LatLng(north, east),
            score: score,
            tier: score == null ? RiskTier.unknown : _tierForScore(score),
          ),
        );
      }
    }
    return cells;
  }

  void _showSafePlaceSheet(BuildContext context, Shelter s) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(8))),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(s.name, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            const SizedBox(height: 2),
            Text(s.district, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
            const SizedBox(height: 8),
            Text(s.hazardProfile, style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
            if (s.distanceKm != null) ...[
              const SizedBox(height: 10),
              Text('${s.distanceKm!.toStringAsFixed(0)} km away', style: AppTheme.numeric(fontSize: 14)),
            ],
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: () => _openDirections(s),
              icon: const Icon(Icons.directions, size: 16),
              label: const Text('DIRECTIONS'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _openDirections(Shelter s) async {
    final uri = Uri.parse(
      'https://www.google.com/maps/dir/?api=1&destination=${s.latitude},${s.longitude}',
    );
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}

class _Legend extends StatelessWidget {
  const _Legend();

  @override
  Widget build(BuildContext context) {
    const entries = [
      ('LOW', AppColors.low),
      ('MODERATE', AppColors.moderate),
      ('HIGH', AppColors.high),
      ('CRITICAL', AppColors.critical),
    ];
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.hairline),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          for (final e in entries)
            Padding(
              padding: const EdgeInsets.only(bottom: 3),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(width: 10, height: 10, color: e.$2.withOpacity(0.75)),
                  const SizedBox(width: 6),
                  Text(
                    e.$1,
                    style: const TextStyle(fontSize: 9.5, color: AppColors.textSecondary, letterSpacing: 0.4),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _PermissionBanner extends StatelessWidget {
  final AlertProvider provider;
  const _PermissionBanner({required this.provider});

  @override
  Widget build(BuildContext context) {
    final serviceOff = provider.locationStatus == LocationStatus.serviceDisabled;
    return InkWell(
      onTap: provider.retryLocationPermission,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        color: AppColors.surfaceRaised,
        child: Row(
          children: [
            Icon(
              serviceOff ? Icons.location_off_outlined : Icons.location_disabled,
              size: 16,
              color: AppColors.moderate,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                serviceOff
                    ? 'Device location is off — tap to retry.'
                    : 'Location permission denied — tap to retry.',
                style: const TextStyle(fontSize: 11.5, color: AppColors.textSecondary),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SafePlaceRow extends StatelessWidget {
  final Shelter shelter;
  final VoidCallback onTapMap;
  const _SafePlaceRow({required this.shelter, required this.onTapMap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTapMap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          border: Border.all(color: AppColors.hairline),
          borderRadius: BorderRadius.circular(3),
        ),
        child: Row(
          children: [
            const Icon(Icons.shield, color: AppColors.low, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(shelter.name, style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600)),
                  Text(shelter.district, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                ],
              ),
            ),
            if (shelter.distanceKm != null)
              Text('${shelter.distanceKm!.toStringAsFixed(0)} km', style: AppTheme.numeric(fontSize: 13)),
          ],
        ),
      ),
    );
  }
}
