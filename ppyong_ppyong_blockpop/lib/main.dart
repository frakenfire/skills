import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'app_state.dart';
import 'ui/app.dart';

/// 뿅뿅 블록팝 진입점 (PRD §1.1).
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
  ]);
  await AppState.instance.init();
  runApp(const BlockpopApp());
}
