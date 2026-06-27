// 기본 provider: 시뮬레이션. 키가 없거나 다른 provider가 실패하면 이걸로 폴백.
// 프론트의 시세 로직을 그대로 재사용해 동일한 데이터 모양을 보장한다.
import { snapshotAll } from '../../src/data/market.js'

export const name = 'sim'

let tick = 0
export async function getQuotes() {
  tick += 1
  return snapshotAll(tick)
}
