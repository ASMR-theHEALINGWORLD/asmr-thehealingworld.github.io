import { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../audio/AudioEngine';
import { useSoundStore } from '../hooks/useSoundStore';
import { useIsMobile } from '../hooks/useMediaQuery';
import type { WorldDef } from '../types';
import { ChevronUp, PauseIcon, PlayIcon } from './Icons';
import { MixExtras } from './MixExtras';
import { ScrollRail } from './ScrollRail';

function Eq({ active }: { active: boolean }) {
  return (
    <span className={`eq ${active ? 'is-active' : ''}`} aria-hidden>
      <i />
      <i />
      <i />
    </span>
  );
}

export function SoundMixer({ world }: { world: WorldDef }) {
  const { mixes, updateSound, playing, setPlaying, muted } = useSoundStore();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(!isMobile);
  useEffect(() => setOpen(!isMobile), [isMobile]);
  const mix = mixes[world.id];
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeCount = world.sounds.filter((s) => mix[s.id]?.on).length;
  const live = playing && !muted;

  return (
    <aside className={`mixer ${open ? 'is-open' : ''}`} aria-label="사운드 믹서">
      <div className="mixer__head">
        <button
          className="play-btn"
          onClick={() => {
            audioEngine.unlock();
            setPlaying(!playing);
          }}
          aria-label={playing ? '일시정지' : '재생'}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button className="mixer__summary" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <strong>사운드 믹서</strong>
          <span>
            {muted ? '음소거 중' : playing ? `${activeCount}개의 소리가 흐르는 중` : '잠시 멈춤'}
            <Eq active={live && activeCount > 0} />
          </span>
        </button>
        <button className="mixer__toggle" onClick={() => setOpen((o) => !o)} aria-label={open ? '믹서 접기' : '믹서 펼치기'}>
          <ChevronUp />
        </button>
      </div>

      <div className="mixer__body">
        <div className="mixer__inner" ref={scrollRef}>
        <ul className="mixer__list">
          {world.sounds.map((s) => {
            const st = mix[s.id];
            const v = Math.round(st.volume * 100);
            return (
              <li key={s.id} className={`sound ${st.on ? 'is-on' : ''}`}>
                <button
                  className="sound__chip"
                  onClick={() => {
                    audioEngine.unlock();
                    updateSound(world.id, s.id, { on: !st.on });
                    if (!playing && !st.on) setPlaying(true);
                  }}
                  aria-pressed={st.on}
                  aria-label={`${s.name} ${st.on ? '끄기' : '켜기'}`}
                >
                  <span>{s.icon}</span>
                </button>
                <div className="sound__body">
                  <div className="sound__name">
                    {s.name}
                    {st.on && <Eq active={live} />}
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={v}
                    aria-label={`${s.name} 볼륨`}
                    style={{ ['--val' as string]: `${v}%` }}
                    onChange={(e) => {
                      audioEngine.unlock();
                      const volume = Number(e.target.value) / 100;
                      updateSound(world.id, s.id, { volume, on: volume > 0 });
                    }}
                  />
                </div>
                <span className="sound__vol">{v}</span>
              </li>
            );
          })}
        </ul>
        <MixExtras world={world} />
        </div>
        <ScrollRail target={scrollRef} deps={[open, world.id]} />
      </div>
    </aside>
  );
}
