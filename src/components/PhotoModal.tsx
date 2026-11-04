import { useEffect, useState } from 'react';
import { SITE_URL } from '../config';
import type { WorldDef } from '../types';

/** 3D 장면을 세로(1080×1920) 사진 카드로 만들어요 — 인스타 스토리에 딱 맞는 크기 */
async function composeCard(src: HTMLCanvasElement, world: WorldDef, shiftCssPx: number): Promise<Blob> {
  const W = 1080;
  const H = 1920;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const [c1, c2] = world.theme.gradient;
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, c1);
  bg.addColorStop(1, c2);
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);

  // 사진 영역 (둥근 모서리)
  const px = 60;
  const py = 60;
  const pw = W - 120;
  const ph = 1440;
  g.save();
  g.beginPath();
  g.roundRect(px, py, pw, ph, 48);
  g.clip();
  g.fillStyle = world.theme.background;
  g.fillRect(px, py, pw, ph);
  const dpr = src.width / src.clientWidth || 1;
  const cx = src.width / 2 - shiftCssPx * dpr; // 데스크톱은 장면이 왼쪽으로 비켜 있어요
  const scale = Math.max(pw / src.width, ph / src.height) * 1.12;
  const sw = pw / scale;
  const sh = ph / scale;
  const sx = Math.min(Math.max(cx - sw / 2, 0), src.width - sw);
  const sy = Math.max((src.height - sh) / 2, 0);
  g.drawImage(src, sx, sy, sw, sh, px, py, pw, ph);
  g.restore();

  // 글자
  await document.fonts.load('64px Jua').catch(() => undefined);
  const ink = world.theme.dark ? '#ffffff' : '#4f423d';
  const sub = world.theme.dark ? 'rgba(255,255,255,0.75)' : 'rgba(79,66,61,0.7)';
  g.textAlign = 'center';
  g.fillStyle = sub;
  g.font = '700 30px "Gowun Dodum", sans-serif';
  g.fillText(`WORLD ${world.no}`, W / 2, 1590);
  g.fillStyle = ink;
  g.font = '72px Jua, sans-serif';
  g.fillText(world.title, W / 2, 1680);
  const d = new Date();
  g.fillStyle = sub;
  g.font = '700 30px "Gowun Dodum", sans-serif';
  g.fillText(`${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} · 오늘의 힐링 ☁`, W / 2, 1745);
  g.font = '700 26px "Gowun Dodum", sans-serif';
  g.fillText(`힐링 월드 · ${SITE_URL.replace(/^https:\/\//, '').replace(/\/$/, '')}`, W / 2, 1850);

  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('blob'))), 'image/jpeg', 0.92));
}

export function PhotoModal({ world, canvas, shift, onClose }: { world: WorldDef; canvas: HTMLCanvasElement; shift: number; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let u: string | null = null;
    composeCard(canvas, world, shift)
      .then((b) => {
        setBlob(b);
        u = URL.createObjectURL(b);
        setUrl(u);
      })
      .catch(() => setError(true));
    return () => {
      if (u) URL.revokeObjectURL(u);
    };
  }, [canvas, world, shift]);

  const fileName = `healingworld-${world.id}-${Date.now()}.jpg`;
  const file = blob ? new File([blob], fileName, { type: 'image/jpeg' }) : null;
  const canShare = !!file && !!navigator.canShare?.({ files: [file] });

  return (
    <div className="modal" role="dialog" aria-label="사진 카드">
      <div className="modal__card photo">
        <div className="photo__flash" aria-hidden />
        {error ? (
          <p className="card__sub">사진을 만들지 못했어요. 다시 시도해 주세요.</p>
        ) : url ? (
          <img className="photo__img" src={url} alt={`${world.title} 사진 카드`} />
        ) : (
          <div className="photo__img photo__img--loading">사진을 만드는 중…</div>
        )}
        <div className="photo__actions">
          {canShare && (
            <button className="cta cta--small" onClick={() => void navigator.share({ files: [file!], title: '힐링 월드', text: `${world.title}에서 쉬어가는 중 ☁` }).catch(() => undefined)}>
              공유하기
            </button>
          )}
          {url && (
            <a className={canShare ? 'pill' : 'cta cta--small'} href={url} download={fileName}>
              이미지 저장
            </a>
          )}
          <button className="pill pill--ghost" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
