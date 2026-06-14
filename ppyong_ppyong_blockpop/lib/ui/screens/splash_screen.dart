import 'dart:async';

import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// 스플래시 (PRD §19.2). 로고 노출 후 1.5초 뒤 메인으로.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    Timer(const Duration(milliseconds: 1500), () {
      if (mounted) Navigator.of(context).pushReplacementNamed('/main');
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.skyBg,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Text('🐑🐼🐰', style: TextStyle(fontSize: 44)),
            SizedBox(height: 8),
            // 제품명: 뿅뿅 블록팝 (금지 표기: 뿡뿡 블록팝)
            Text('뿅뿅',
                style: TextStyle(
                    fontSize: 44,
                    fontWeight: FontWeight.w900,
                    color: AppColors.feverPink)),
            Text('블록팝',
                style: TextStyle(
                    fontSize: 40,
                    fontWeight: FontWeight.w900,
                    color: AppColors.blue)),
            SizedBox(height: 24),
            SizedBox(
              width: 28,
              height: 28,
              child: CircularProgressIndicator(strokeWidth: 3),
            ),
          ],
        ),
      ),
    );
  }
}
