import { SHARE_INTRO } from '../data/copy';

// PRD §12 — 공유. 친구에게 카드 보내기는 광고 없음(§8.6).
// 앱인토스 웹뷰에서는 Web Share API 또는 클립보드 복사로 동작한다.

export function buildShareText(hopeLine: string): string {
  return `${SHARE_INTRO}\n\n"${hopeLine}"\n\n[오늘의 마음 한 장]`;
}

/** 텍스트 클립보드 복사. 성공 여부 반환. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallthrough */
  }
  // 폴백: execCommand
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

/** 친구에게 카드 보내기 — 네이티브 공유 시트가 있으면 사용, 없으면 복사 폴백 */
export async function shareOrCopy(hopeLine: string): Promise<'shared' | 'copied' | 'failed'> {
  const text = buildShareText(hopeLine);
  const nav = navigator as Navigator & {
    share?: (data: { text?: string; title?: string }) => Promise<void>;
  };
  if (typeof nav.share === 'function') {
    try {
      await nav.share({ title: '오늘의 마음 한 장', text });
      return 'shared';
    } catch {
      /* 사용자가 취소했거나 미지원 → 복사 폴백 */
    }
  }
  const copied = await copyText(text);
  return copied ? 'copied' : 'failed';
}
