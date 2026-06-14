import 'package:flutter/material.dart';

import '../../app_state.dart';
import '../theme/app_colors.dart';
import '../theme/background_skins.dart';
import '../theme/block_skins.dart';

class _ShopItem {
  final String id;
  final String name;
  final int price;
  final bool isBackground;
  const _ShopItem(this.id, this.name, this.price, this.isBackground);
}

/// 상점 화면 (PRD §17.4, §19.8)
class ShopScreen extends StatefulWidget {
  const ShopScreen({super.key});

  @override
  State<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends State<ShopScreen> {
  // 가격 (PRD §17.4)
  static const List<_ShopItem> _items = [
    _ShopItem(BlockSkins.jellyDefault, '젤리 블록', 0, false),
    _ShopItem(BlockSkins.cookie, '쿠키 블록', 300, false),
    _ShopItem(BlockSkins.cloud, '구름 블록', 500, false),
    _ShopItem(BackgroundSkins.forest, '숲속 놀이터', 0, true),
    _ShopItem(BackgroundSkins.canal, '운하 마을', 400, true),
    _ShopItem(BackgroundSkins.dessert, '디저트 가게', 600, true),
    _ShopItem(BackgroundSkins.nap, '낮잠 공원', 800, true),
  ];

  @override
  Widget build(BuildContext context) {
    final app = AppState.instance;
    return Scaffold(
      backgroundColor: AppColors.cream,
      appBar: AppBar(
        title: const Text('상점'),
        backgroundColor: AppColors.cream,
        foregroundColor: AppColors.textDark,
        elevation: 0,
      ),
      body: ValueListenableBuilder<int>(
        valueListenable: app.revision,
        builder: (context, _, __) {
          final coins = app.data.player.totalCoins;
          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(12),
                child: Align(
                  alignment: Alignment.centerRight,
                  child: Text('🪙 $coins',
                      style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: AppColors.coin)),
                ),
              ),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: [
                    _section('블록 스킨'),
                    ..._items.where((i) => !i.isBackground).map(_tile),
                    _section('배경 스킨'),
                    ..._items.where((i) => i.isBackground).map(_tile),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _section(String title) => Padding(
        padding: const EdgeInsets.fromLTRB(4, 14, 4, 6),
        child: Text(title,
            style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w900,
                color: AppColors.textDark)),
      );

  Widget _tile(_ShopItem item) {
    final skins = AppState.instance.data.skins;
    final owned = item.isBackground
        ? skins.ownsBackground(item.id)
        : skins.ownsBlock(item.id);
    final selected = item.isBackground
        ? skins.selectedBackground == item.id
        : skins.selectedBlockSkin == item.id;

    return Card(
      color: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: ListTile(
        title: Text(item.name,
            style: const TextStyle(fontWeight: FontWeight.w700)),
        subtitle: Text(item.price == 0 ? '기본 지급' : '🪙 ${item.price}'),
        trailing: _action(item, owned, selected),
      ),
    );
  }

  Widget _action(_ShopItem item, bool owned, bool selected) {
    if (selected) {
      return const Chip(
          label: Text('적용 중'),
          backgroundColor: AppColors.green,
          labelStyle: TextStyle(color: Colors.white));
    }
    if (owned) {
      return ElevatedButton(
        onPressed: () => _apply(item),
        style: ElevatedButton.styleFrom(backgroundColor: AppColors.blue),
        child: const Text('적용'),
      );
    }
    return ElevatedButton(
      onPressed: () => _buy(item),
      style: ElevatedButton.styleFrom(backgroundColor: AppColors.yellow),
      child: const Text('구매'),
    );
  }

  Future<void> _buy(_ShopItem item) async {
    final app = AppState.instance;
    if (app.data.player.totalCoins < item.price) {
      _toast('코인이 부족해요');
      return;
    }
    app.data.player.totalCoins -= item.price;
    if (item.isBackground) {
      app.data.skins.ownedBackgrounds.add(item.id);
    } else {
      app.data.skins.ownedBlockSkins.add(item.id);
    }
    await app.persist();
    _apply(item);
  }

  Future<void> _apply(_ShopItem item) async {
    final app = AppState.instance;
    if (item.isBackground) {
      app.data.skins.selectedBackground = item.id;
    } else {
      app.data.skins.selectedBlockSkin = item.id;
    }
    await app.persist();
    setState(() {});
  }

  void _toast(String msg) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(msg)));
  }
}
