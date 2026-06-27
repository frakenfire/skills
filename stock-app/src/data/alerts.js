// 가격 알림 — 실제 브라우저 알림(Web Notifications API)으로 발송한다.
// 목표가에 도달하면 알림을 띄우고 triggered로 표시. localStorage에 영속.
// (앱이 열려 있는 동안 동작. 앱이 닫혀도 받으려면 서비스워커+푸시서버가 필요 — README 참고)
const KEY = 'stockpulse.alerts.v1'

export function loadAlerts() {
  try {
    const raw = localStorage.getItem(KEY)
    const arr = raw ? JSON.parse(raw) : null
    if (Array.isArray(arr)) return arr
  } catch { /* ignore */ }
  return []
}

export function saveAlerts(alerts) {
  try { localStorage.setItem(KEY, JSON.stringify(alerts)) } catch { /* ignore */ }
}

export function makeAlert(stock, target, dir) {
  return {
    id: `${stock.symbol}-${target}-${dir}-${loadAlerts().length}-${Math.round(target)}`,
    symbol: stock.symbol,
    name: stock.name,
    target: Math.round(target),
    dir, // 'up' | 'down'
    triggered: false,
  }
}

// 알림 권한 요청(처음 켤 때).
export async function ensurePermission() {
  if (typeof Notification === 'undefined') return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  try {
    const res = await Notification.requestPermission()
    return res === 'granted'
  } catch { return false }
}

function notify(title, body) {
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, { body })
      return true
    }
  } catch { /* ignore */ }
  return false
}

// 현재 시세로 알림 조건을 점검. 도달한 알림은 발송 후 triggered 처리.
// 반환: { alerts: 갱신된 목록, fired: 방금 발동한 알림[] }
export function checkAlerts(alerts, stocks) {
  let changed = false
  const fired = []
  const next = alerts.map((a) => {
    if (a.triggered) return a
    const s = stocks.find((x) => x.symbol === a.symbol)
    if (!s) return a
    const hit = a.dir === 'up' ? s.price >= a.target : s.price <= a.target
    if (hit) {
      changed = true
      fired.push({ ...a, price: s.price })
      return { ...a, triggered: true }
    }
    return a
  })
  fired.forEach((a) => {
    const arrow = a.dir === 'up' ? '도달(이상)' : '도달(이하)'
    notify(`${a.name} 목표가 ${arrow}`, `목표 ${a.target.toLocaleString('ko-KR')}원 — 지금 ${a.price.toLocaleString('ko-KR')}원`)
  })
  return { alerts: changed ? next : alerts, fired }
}
