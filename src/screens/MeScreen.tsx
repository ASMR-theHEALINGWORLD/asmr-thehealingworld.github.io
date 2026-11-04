import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { MOODS } from '../data/comfort';
import { WORLDS, getWorld } from '../data/worlds';
import { useSoundStore } from '../hooks/useSoundStore';
import { isIOS, isStandalone, promptInstall, usePwa } from '../pwa';
import { addDays, dayKey, formatDuration } from '../store/dates';
import { toast } from '../store/toast';
import { streakOf, useUser, userActions, type Avatar, type UserData } from '../store/userStore';
import { Character, type HairStyle } from '../three/Character';
import { RoundDisc } from '../three/common';
import type { Route } from '../types';
import { ChevronLeft } from '../components/Icons';

type Tab = 'record' | 'avatar' | 'settings';
const WORLD_ICON: Record<string, string> = { campfire: '🔥', ocean: '🫧', bookstore: '📖', cloud: '☁️', moss: '🌿', station: '🚂' };
const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];

export function MeScreen({ tab, navigate }: { tab: Tab; navigate: (r: Route) => void }) {
  const tabs: [Tab, string][] = [
    ['record', '힐링 기록'],
    ['avatar', '내 캐릭터'],
    ['settings', '설정'],
  ];
  return (
    <div className="screen me">
      <header className="me__head">
        <button className="pill" onClick={() => (history.length > 1 ? history.back() : navigate({ name: 'home' }))}>
          <ChevronLeft /> 돌아가기
        </button>
        <h1>마이 힐링</h1>
        <span className="me__spacer" />
      </header>
      <nav className="me__tabs" role="tablist">
        {tabs.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'is-on' : ''} onClick={() => navigate({ name: 'me', tab: id })}>
            {label}
          </button>
        ))}
      </nav>
      <main className="me__body">
        {tab === 'record' && <RecordTab navigate={navigate} />}
        {tab === 'avatar' && <AvatarTab />}
        {tab === 'settings' && <SettingsTab />}
      </main>
    </div>
  );
}

/* ================= 힐링 기록 ================= */
function RecordTab({ navigate }: { navigate: (r: Route) => void }) {
  const u = useUser((x) => x);
  const { setWorldMix } = useSoundStore();
  const today = u.days[dayKey()]?.sec ?? 0;
  const total = Object.values(u.worlds).reduce((a, w) => a + w.sec, 0);
  const streak = streakOf(u);
  const foundCount = WORLDS.filter((w) => u.found[w.id]).length;
  const week = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i - 6));

  return (
    <div className="me__stack">
      <section className="tiles">
        <div className="tile">
          <span className="tile__label">오늘 쉰 시간</span>
          <strong className="tile__value">{formatDuration(today)}</strong>
        </div>
        <div className="tile">
          <span className="tile__label">연속 방문</span>
          <strong className="tile__value">{streak}일</strong>
        </div>
        <div className="tile">
          <span className="tile__label">전체 힐링 시간</span>
          <strong className="tile__value">{formatDuration(total)}</strong>
        </div>
      </section>

      <section className="card">
        <h2 className="card__title">이번 주 힐링 시간</h2>
        <p className="card__sub">소리를 켜 두고 머문 시간이에요 (분)</p>
        <WeekChart u={u} days={week} />
        <div className="mood-row" aria-label="최근 7일 기분">
          {week.map((d) => {
            const m = MOODS.find((x) => x.id === u.days[dayKey(d)]?.mood);
            return (
              <span key={dayKey(d)} className="mood-row__cell" title={m ? m.label : '기록 없음'}>
                {m ? m.emoji : '·'}
              </span>
            );
          })}
        </div>
      </section>

      <section className="card">
        <h2 className="card__title">월드 스탬프</h2>
        <p className="card__sub">
          방문한 월드에 도장이 찍혀요 · 숨은 친구 {foundCount}/{WORLDS.length}
        </p>
        <div className="stamps">
          {WORLDS.map((w) => {
            const rec = u.worlds[w.id];
            const visited = !!rec?.visits;
            return (
              <button key={w.id} className={`stamp ${visited ? 'is-on' : ''}`} style={{ ['--accent' as string]: w.theme.accent }} onClick={() => navigate({ name: 'world', id: w.id })}>
                <span className="stamp__seal">{WORLD_ICON[w.id]}</span>
                <span className="stamp__name">{w.title}</span>
                <span className="stamp__meta">
                  {visited ? formatDuration(rec.sec) : '아직 안 가봤어요'}
                  {u.found[w.id] ? ' · ⭐ 숨은 친구' : visited ? ' · ❔' : ''}
                </span>
                {u.favorites.includes(w.id) && <span className="stamp__fav" aria-label="즐겨찾기">♥</span>}
              </button>
            );
          })}
        </div>
      </section>

      {u.recent.length > 0 && (
        <section className="card">
          <h2 className="card__title">최근 머문 월드</h2>
          <div className="chips">
            {u.recent.map((id) => {
              const w = getWorld(id);
              return w ? (
                <button key={id} className="chip" onClick={() => navigate({ name: 'world', id })}>
                  {WORLD_ICON[id]} {w.title}
                </button>
              ) : null;
            })}
          </div>
        </section>
      )}

      <section className="card">
        <h2 className="card__title">내 믹스 프리셋</h2>
        {u.presets.length === 0 ? (
          <p className="card__sub">월드의 사운드 믹서에서 “지금 믹스 저장”을 누르면 여기에 모여요.</p>
        ) : (
          <ul className="preset-list">
            {u.presets.map((p) => {
              const w = getWorld(p.worldId);
              return (
                <li key={p.id}>
                  <button
                    className="preset-list__main"
                    onClick={() => {
                      setWorldMix(p.worldId, p.mix);
                      navigate({ name: 'world', id: p.worldId });
                    }}
                  >
                    <strong>{p.name}</strong>
                    <span>
                      {WORLD_ICON[p.worldId]} {w?.title}
                    </span>
                  </button>
                  <button className="icon-btn icon-btn--sm" aria-label={`${p.name} 삭제`} onClick={() => userActions.deletePreset(p.id)}>
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

/** 이번 주 7일 막대 그래프 (단일 시리즈 → 범례 없음, 오늘과 최댓값만 값 표시) */
function WeekChart({ u, days }: { u: UserData; days: Date[] }) {
  const mins = days.map((d) => Math.round((u.days[dayKey(d)]?.sec ?? 0) / 60));
  const max = Math.max(...mins);
  const step = max <= 10 ? 5 : max <= 30 ? 10 : max <= 60 ? 20 : max <= 150 ? 50 : 100;
  const top = Math.max(step, Math.ceil(max / step) * step);
  const ticks = top % 2 === 0 ? [0, top / 2, top] : [0, top];
  const maxIdx = max > 0 ? mins.indexOf(max) : -1;
  return (
    <figure className="week">
      <div className="week__plot">
        {ticks.map((t) => (
          <div key={t} className="week__grid" style={{ bottom: `${(t / top) * 100}%` }}>
            <span>{t}</span>
          </div>
        ))}
        <div className="week__bars">
          {days.map((d, i) => {
            const isToday = i === 6;
            const h = (mins[i] / top) * 100;
            const label = `${d.getMonth() + 1}월 ${d.getDate()}일 · ${mins[i]}분`;
            return (
              <button key={i} className="week__col" aria-label={label} data-tip={label}>
                {(isToday || i === maxIdx) && mins[i] > 0 && (
                  <span className="week__value" style={{ bottom: `calc(${h}% + 4px)` }}>
                    {mins[i]}
                  </span>
                )}
                <span className="week__bar" style={{ height: `${h}%` }} />
              </button>
            );
          })}
        </div>
      </div>
      <div className="week__axis">
        {days.map((d, i) => (
          <span key={i} className={i === 6 ? 'is-today' : ''}>
            {i === 6 ? '오늘' : WEEKDAY[d.getDay()]}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>최근 7일 힐링 시간</caption>
        <tbody>
          {days.map((d, i) => (
            <tr key={i}>
              <th>{dayKey(d)}</th>
              <td>{mins[i]}분</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/* ================= 내 캐릭터 ================= */
const HAIR_STYLES: [HairStyle, string][] = [
  ['long', '긴 머리'],
  ['bob', '단발'],
  ['short', '짧은 머리'],
  ['bun', '똥머리'],
  ['pigtail', '양갈래'],
];
const HAIR_COLORS = ['#3a2a24', '#6b4a3a', '#a8664a', '#f2c27b', '#c9a6ff', '#ff9fb5'];
const TOP_COLORS = ['#a9c4f5', '#ffc2c7', '#ffe08a', '#b9e3c6', '#c9b6f2', '#ffffff', '#ffb38a', '#7f8fd1'];
const BOTTOM_COLORS = ['#fbf7f0', '#9db8e8', '#8fb7a0', '#f4b8a8', '#5d5f7a', '#e9d3b4'];

function Spin({ children }: { children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.5;
  });
  return <group ref={ref}>{children}</group>;
}

function AvatarTab() {
  const a = useUser((u) => u.avatar);
  const set = (p: Partial<Avatar>) => userActions.setAvatar(p);
  return (
    <div className="me__stack avatar">
      <section className="card avatar__preview">
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 1.1, 3.2], fov: 32 }}>
          <color attach="background" args={['#f4ecf7']} />
          <ambientLight intensity={0.8} />
          <hemisphereLight args={['#ffffff', '#d8c8e8', 0.8]} />
          <directionalLight position={[2, 4, 3]} intensity={1.6} castShadow shadow-mapSize={[512, 512]} />
          <Spin>
            <RoundDisc radius={0.9} height={0.18} color="#bfe3c9" position={[0, -0.18, 0]} />
            <Character look={{ ...a }} holding="wave" emojis={['💛', '✨', '😊']} />
          </Spin>
          <OrbitControls target={[0, 0.55, 0]} enablePan={false} enableZoom={false} />
        </Canvas>
        <label className="switch">
          <input type="checkbox" checked={a.enabled} onChange={(e) => set({ enabled: e.target.checked })} />
          <span className="switch__track" aria-hidden />
          <span>월드에 내 캐릭터 함께하기</span>
        </label>
      </section>
      <section className="card">
        <h2 className="card__title">머리 모양</h2>
        <div className="chips">
          {HAIR_STYLES.map(([id, label]) => (
            <button key={id} className={`chip ${a.hairStyle === id ? 'is-on' : ''}`} onClick={() => set({ hairStyle: id })}>
              {label}
            </button>
          ))}
        </div>
        <Swatches title="머리 색" colors={HAIR_COLORS} value={a.hair} onPick={(c) => set({ hair: c })} />
        <Swatches title="상의" colors={TOP_COLORS} value={a.top} onPick={(c) => set({ top: c })} />
        <h3 className="card__h3">하의</h3>
        <div className="chips">
          {(['skirt', 'pants'] as const).map((t) => (
            <button key={t} className={`chip ${a.bottomType === t ? 'is-on' : ''}`} onClick={() => set({ bottomType: t })}>
              {t === 'skirt' ? '치마' : '바지'}
            </button>
          ))}
        </div>
        <Swatches title="하의 색" colors={BOTTOM_COLORS} value={a.bottom} onPick={(c) => set({ bottom: c })} />
      </section>
    </div>
  );
}

function Swatches({ title, colors, value, onPick }: { title: string; colors: string[]; value: string; onPick: (c: string) => void }) {
  return (
    <>
      <h3 className="card__h3">{title}</h3>
      <div className="swatches">
        {colors.map((c) => (
          <button key={c} className={`swatch ${value === c ? 'is-on' : ''}`} style={{ background: c }} aria-label={`${title} ${c}`} aria-pressed={value === c} onClick={() => onPick(c)} />
        ))}
      </div>
    </>
  );
}

/* ================= 설정 ================= */
function SettingsTab() {
  const s = useUser((u) => u.settings);
  const pwa = usePwa();
  const [confirmReset, setConfirmReset] = useState(false);
  const standalone = isStandalone();
  return (
    <div className="me__stack">
      <section className="card">
        <label className="switch switch--row">
          <span className="switch__text">
            <strong>소리만 듣기 (저사양 모드)</strong>
            <span>3D 화면 대신 가벼운 배경을 보여줘요. 오래된 휴대폰이나 배터리를 아낄 때 좋아요.</span>
          </span>
          <input type="checkbox" checked={s.lowSpec} onChange={(e) => userActions.setSettings({ lowSpec: e.target.checked })} />
          <span className="switch__track" aria-hidden />
        </label>
        <label className="switch switch--row">
          <span className="switch__text">
            <strong>계절 효과</strong>
            <span>계절에 따라 낙엽, 눈, 벚꽃이 흩날려요.</span>
          </span>
          <input type="checkbox" checked={s.seasonal === 'auto'} onChange={(e) => userActions.setSettings({ seasonal: e.target.checked ? 'auto' : 'off' })} />
          <span className="switch__track" aria-hidden />
        </label>
      </section>

      <section className="card">
        <h2 className="card__title">📱 홈 화면에 설치하기</h2>
        {standalone || pwa.installed ? (
          <p className="card__sub">이미 앱으로 설치되어 있어요.</p>
        ) : pwa.prompt ? (
          <>
            <p className="card__sub">앱처럼 바로 열리고, 인터넷이 없어도 열 수 있어요.</p>
            <button className="cta cta--small" onClick={() => void promptInstall()}>
              설치하기 <span className="cta__arrow">→</span>
            </button>
          </>
        ) : isIOS ? (
          <p className="card__sub">
            사파리 아래쪽의 <b>공유 버튼</b>을 누르고 <b>“홈 화면에 추가”</b>를 선택하세요.
          </p>
        ) : (
          <p className="card__sub">브라우저 메뉴(⋮)에서 <b>“앱 설치”</b> 또는 <b>“홈 화면에 추가”</b>를 선택하세요.</p>
        )}
      </section>

      <section className="card">
        <h2 className="card__title">내 데이터</h2>
        <p className="card__sub">기록, 프리셋, 캐릭터는 로그인 없이 이 브라우저에만 저장돼요. 다른 기기와는 공유되지 않아요.</p>
        {confirmReset ? (
          <div className="confirm">
            <span>힐링 기록과 스탬프를 모두 지울까요?</span>
            <button
              className="pill pill--danger"
              onClick={() => {
                userActions.resetRecords();
                setConfirmReset(false);
                toast('기록을 지웠어요', '🧹');
              }}
            >
              지우기
            </button>
            <button className="pill" onClick={() => setConfirmReset(false)}>
              취소
            </button>
          </div>
        ) : (
          <button className="pill" onClick={() => setConfirmReset(true)}>
            힐링 기록 초기화
          </button>
        )}
      </section>
      <p className="me__foot">힐링 월드 · 귀여운 미니어처 세계의 ASMR</p>
    </div>
  );
}
