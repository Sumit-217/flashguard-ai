import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:flashguard_app/providers/alert_provider.dart';
import 'package:flashguard_app/providers/connectivity_provider.dart';
import 'package:flashguard_app/core/theme/app_theme.dart';
import 'package:flashguard_app/features/home/home_screen.dart';

void main() {
  testWidgets('HomeScreen renders the FlashGuard app bar', (tester) async {
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => ConnectivityProvider()),
          ChangeNotifierProvider(create: (_) => AlertProvider()),
        ],
        child: MaterialApp(
          theme: AppTheme.dark,
          home: const HomeScreen(),
        ),
      ),
    );

    // Location/network calls won't resolve in the widget-test environment,
    // so this only asserts the shell renders without throwing.
    await tester.pump();

    expect(find.text('FLASHGUARD'), findsOneWidget);
  });
}
