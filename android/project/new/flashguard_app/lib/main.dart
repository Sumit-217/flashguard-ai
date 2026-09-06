import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/theme/app_theme.dart';
import 'providers/alert_provider.dart';
import 'providers/connectivity_provider.dart';
import 'providers/profile_provider.dart';
import 'features/home/home_screen.dart';
import 'features/alerts/alert_screen.dart';
import 'features/route/route_screen.dart';
import 'features/map/risk_map_screen.dart';
import 'features/offline/offline_screen.dart';
import 'features/profile/profile_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const FlashGuardApp());
}

class FlashGuardApp extends StatelessWidget {
  const FlashGuardApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ConnectivityProvider()),
        ChangeNotifierProxyProvider<ConnectivityProvider, AlertProvider>(
          create: (_) => AlertProvider()..initialize(),
          update: (_, connectivity, alertProvider) {
            alertProvider!.attachConnectivity(connectivity);
            return alertProvider;
          },
        ),
        ChangeNotifierProvider(create: (_) => ProfileProvider()..initialize()),
      ],
      child: MaterialApp(
        title: 'FlashGuard',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.dark,
        darkTheme: AppTheme.dark,
        themeMode: ThemeMode.dark,
        home: const AppShell(),
      ),
    );
  }
}

/// Bottom-nav shell hosting the four feature screens. Kept in main.dart
/// (rather than a separate widget file) since it is pure app composition,
/// not a feature in its own right.
class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _index = 0;

  static const _screens = [
    HomeScreen(),
    AlertScreen(),
    RouteScreen(),
    RiskMapScreen(),
    OfflineScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final alerts = context.watch<AlertProvider>();
    final criticalCount =
        alerts.activeAlerts.where((a) => a.isCritical).length;

    return Scaffold(
      body: SafeArea(
        child: IndexedStack(index: _index, children: _screens),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _index,
        onTap: (i) => setState(() => _index = i),
        items: [
          const BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard),
            label: 'DASHBOARD',
          ),
          BottomNavigationBarItem(
            icon: _AlertIcon(count: criticalCount, filled: false),
            activeIcon: _AlertIcon(count: criticalCount, filled: true),
            label: 'ALERTS',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.alt_route_outlined),
            activeIcon: Icon(Icons.alt_route),
            label: 'SAFE ROUTE',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.map_outlined),
            activeIcon: Icon(Icons.map),
            label: 'RISK MAP',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.cloud_off_outlined),
            activeIcon: Icon(Icons.cloud_off),
            label: 'OFFLINE',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'PROFILE',
          ),
        ],
      ),
    );
  }
}

class _AlertIcon extends StatelessWidget {
  final int count;
  final bool filled;

  const _AlertIcon({required this.count, required this.filled});

  @override
  Widget build(BuildContext context) {
    final icon = Icon(filled ? Icons.warning_amber : Icons.warning_amber_outlined);
    if (count <= 0) return icon;
    return Badge(
      backgroundColor: AppColors.critical,
      label: Text('$count'),
      child: icon,
    );
  }
}
