import { cardEmoji } from '../data/cards';

// PRD §8.6 — 결과 카드 저장하기.
// 외부 라이브러리 없이 Canvas 로 결과 카드를 그려 PNG 로 저장한다.

type SaveCardInput = {
  cardId: string;
  cardName: string;
  hopeLine: string;
};

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const chars = [...text];
  const lines: string[] = [];
  let line = '';
  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line !== '') {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** 결과 카드를 PNG 로 렌더링해 다운로드. 성공 여부 반환. */
export async function saveResultCard(input: SaveCardInput): Promise<boolean> {
  try {
    const W = 720;
    const H = 1080;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    // 배경 (SIGNATURE GREEN 그라디언트)
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#16564f');
    grad.addColorStop(0.55, '#114e48');
    grad.addColorStop(1, '#0d3d38');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';

    // 이모지
    ctx.font = '120px sans-serif';
    ctx.fillText(cardEmoji(input.cardId), W / 2, H * 0.3);

    // 카드 이름
    ctx.fillStyle = 'rgba(255,255,255,0.82)';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText(`${input.cardName} 카드`, W / 2, H * 0.4);

    // 오늘의 한 문장
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 46px sans-serif';
    const lines = wrapText(ctx, input.hopeLine, W - 140);
    const lineHeight = 66;
    const startY = H * 0.5;
    lines.forEach((ln, i) => {
      ctx.fillText(ln, W / 2, startY + i * lineHeight);
    });

    // 워터마크
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('오늘의 마음 한 장', W / 2, H - 80);

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `today-mind-card-${input.cardId}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } catch {
    return false;
  }
}
