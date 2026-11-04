import type { WorldDef } from '../types';

const ICON: Record<string, string> = { campfire: '🔥', ocean: '🫧', bookstore: '📖', cloud: '☁️', moss: '🌿', station: '🚂' };

/** 저사양 모드: 3D 대신 가벼운 그라데이션 배경 */
export function LowSpecStage({ world }: { world: WorldDef }) {
  const [a, b] = world.theme.gradient;
  return (
    <div className="lowspec" style={{ background: `radial-gradient(120% 80% at 50% 35%, ${a}, ${b})` }} aria-hidden>
      <span className="lowspec__blob lowspec__blob--1" />
      <span className="lowspec__blob lowspec__blob--2" />
      <span className="lowspec__icon">{ICON[world.id] ?? '☁️'}</span>
      <span className="lowspec__note">소리만 듣기 모드</span>
    </div>
  );
}
