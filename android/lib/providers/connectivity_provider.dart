import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';

/// Tracks whether the device currently has *some* network path
/// (Wi-Fi/mobile). This does not guarantee the backend itself is
/// reachable — [AlertProvider] still has to try the request and fall back
/// — but it lets the UI immediately show an offline indicator without
/// waiting for a request to time out, and lets AlertProvider know when
/// it's worth retrying after a drop.
class ConnectivityProvider extends ChangeNotifier {
  final Connectivity _connectivity;
  StreamSubscription<List<ConnectivityResult>>? _subscription;

  bool _isOnline = true;
  bool get isOnline => _isOnline;

  /// Fires once whenever connectivity transitions from offline -> online,
  /// so listeners (AlertProvider) can trigger an immediate refresh.
  final StreamController<void> _reconnected = StreamController<void>.broadcast();
  Stream<void> get onReconnected => _reconnected.stream;

  ConnectivityProvider({Connectivity? connectivity})
      : _connectivity = connectivity ?? Connectivity() {
    _init();
  }

  Future<void> _init() async {
    try {
      final initial = await _connectivity.checkConnectivity();
      _applyResult(initial);
    } catch (_) {
      // Assume online if the platform check itself fails; the actual HTTP
      // call will surface the real state.
    }

    _subscription = _connectivity.onConnectivityChanged.listen(_applyResult);
  }

  void _applyResult(List<ConnectivityResult> results) {
    final wasOnline = _isOnline;
    _isOnline = results.any((r) => r != ConnectivityResult.none);
    if (_isOnline != wasOnline) {
      notifyListeners();
      if (_isOnline && !wasOnline) {
        _reconnected.add(null);
      }
    }
  }

  @override
  void dispose() {
    _subscription?.cancel();
    _reconnected.close();
    super.dispose();
  }
}
