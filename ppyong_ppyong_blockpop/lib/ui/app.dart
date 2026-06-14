import 'package:flutter/material.dart';

import 'screens/main_screen.dart';
import 'screens/splash_screen.dart';
import 'theme/app_colors.dart';

/// 앱 루트 (PRD §19.1 화면 흐름).
class BlockpopApp extends StatelessWidget {
  const BlockpopApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '뿅뿅 블록팝',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: AppColors.cream,
        colorScheme: ColorScheme.fromSeed(seedColor: AppColors.pink),
        fontFamily: null,
      ),
      initialRoute: '/',
      routes: {
        '/': (_) => const SplashScreen(),
        '/main': (_) => const MainScreen(),
      },
    );
  }
}
