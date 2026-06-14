/// 게임 상태 머신 (PRD §24.1)
enum GameState {
  init,
  ready,
  spawn,
  falling,
  lockDelay,
  lineClear,
  characterReaction,
  fever,
  paused,
  gameOver,
  result,
}
