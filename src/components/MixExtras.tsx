import { useState } from 'react';
import { shareUrl } from '../data/mixCode';
import { useSoundStore } from '../hooks/useSoundStore';
import { toast } from '../store/toast';
import { useUser, userActions } from '../store/userStore';
import type { WorldDef } from '../types';

/** 믹서 아래: 프리셋(저장/불러오기) + 친구에게 믹스 공유 */
export function MixExtras({ world }: { world: WorldDef }) {
  const { mixes, setWorldMix, resetWorld } = useSoundStore();
  const presets = useUser((u) => u.presets);
  const mine = presets.filter((p) => p.worldId === world.id);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const mix = mixes[world.id];

  const save = () => {
    const n = name.trim() || `나의 믹스 ${mine.length + 1}`;
    userActions.savePreset(world.id, n.slice(0, 16), mix);
    setNaming(false);
    setName('');
    toast(`“${n.slice(0, 16)}” 믹스를 저장했어요`, '💾');
  };

  const share = async () => {
    const url = shareUrl(world, mix);
    const text = `힐링 월드 · ${world.title}에서 내가 만든 소리 믹스를 들어봐요 🎧`;
    if (navigator.share) {
      try {
        await navigator.share({ title: '힐링 월드', text, url });
        return;
      } catch {
        /* 취소하거나 지원하지 않으면 복사로 */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast('믹스 링크를 복사했어요. 친구에게 붙여넣어 보내요!', '🔗', 3500);
    } catch {
      setFallbackUrl(url);
    }
  };

  return (
    <div className="mix-extras">
      <div className="mix-extras__label">프리셋</div>
      <div className="chips chips--tight">
        <button className="chip" onClick={() => resetWorld(world.id)}>
          기본
        </button>
        {mine.map((p) => (
          <span key={p.id} className="chip chip--preset">
            <button onClick={() => setWorldMix(world.id, p.mix)}>{p.name}</button>
            <button className="chip__x" aria-label={`${p.name} 삭제`} onClick={() => userActions.deletePreset(p.id)}>
              ✕
            </button>
          </span>
        ))}
        {!naming && (
          <button className="chip chip--add" onClick={() => setNaming(true)}>
            ＋ 지금 믹스 저장
          </button>
        )}
      </div>
      {naming && (
        <form
          className="preset-form"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <input
            id="preset-name"
            autoFocus
            maxLength={16}
            placeholder="예: 잠잘 때, 공부할 때"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="프리셋 이름"
          />
          <button type="submit" className="pill">
            저장
          </button>
          <button type="button" className="pill pill--ghost" onClick={() => setNaming(false)}>
            취소
          </button>
        </form>
      )}
      <button className="mix-extras__share" onClick={() => void share()}>
        🔗 친구에게 이 믹스 공유하기
      </button>
      {fallbackUrl && (
        <input
          id="share-url"
          className="mix-extras__url"
          readOnly
          value={fallbackUrl}
          aria-label="공유 링크 (길게 눌러 복사하세요)"
          onFocus={(e) => e.currentTarget.select()}
          autoFocus
        />
      )}
    </div>
  );
}
