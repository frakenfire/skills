// AI 코멘트 — Google Gemini로 종목의 '현재 상태'를 자연스러운 한 줄로 서술한다.
// 권유/지시는 프롬프트에서 금지(법적 톤 유지). 키가 없으면 null → 프론트는 기본 문구 사용.
//
// 필요한 env: GEMINI_API_KEY  (선택: GEMINI_MODEL, 기본 gemini-2.0-flash)
export async function insight(stock) {
  const key = process.env.GEMINI_API_KEY
  if (!key) return null
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

  const prompt =
    '너는 주식 초보자용 앱의 카피라이터다. 아래 종목의 "현재 상태"를 한국어 한 문장(35자 이내)으로 ' +
    '친근하고 담백하게 서술하라. 매수/매도/추천 같은 투자 권유나 지시는 절대 쓰지 말 것. ' +
    '종목명 반복 금지, 따옴표 금지.\n' +
    `데이터: 현재가 ${stock.price}, 전일대비 ${stock.changePct.toFixed(2)}%`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: AbortSignal.timeout(8000),
      },
    )
    if (!res.ok) return null
    const json = await res.json()
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    return text ? text.replace(/^["']|["']$/g, '') : null
  } catch {
    return null
  }
}
