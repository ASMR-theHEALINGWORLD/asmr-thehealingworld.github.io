/**
 * AudioEngine — 여러 ASMR 루프를 동시에 재생/믹싱하는 싱글톤.
 *
 * - 각 사운드는 독립된 GainNode 채널을 가지며 개별 볼륨/온오프가 가능합니다.
 * - src 경로의 실제 음원을 먼저 시도하고, 없거나 디코딩에 실패하면
 *   synth.ts 의 절차적 사운드로 자동 대체합니다. (추후 파일만 넣으면 교체 완료)
 * - 모든 루프는 AudioBufferSourceNode.loop 로 끊김 없이 반복됩니다.
 */
import type { SfxKind, SoundDef } from '../types';
import { SR, synthLoop, synthSfx } from './synth';

interface Channel {
  source: AudioBufferSourceNode;
  gain: GainNode;
}

const FADE = 0.6;
const curve = (v: number) => v * v; // 사람이 느끼는 음량에 가깝게

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private buffers = new Map<string, Promise<AudioBuffer>>();
  private sfxBuffers = new Map<SfxKind, AudioBuffer>();
  private channels = new Map<string, Channel>();
  private muted = false;
  /** 사운드 출처 기록 (file | synth) — UI 표시용 */
  readonly origin = new Map<string, 'file' | 'synth'>();

  private ensure(): AudioContext {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      // 부드러운 컴프레서로 여러 사운드를 섞어도 튀지 않게
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 3;
      this.master.connect(comp).connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  /** 사용자 제스처 안에서 호출해 오디오를 깨웁니다 (모바일 대응) */
  unlock() {
    this.ensure();
  }

  private toBuffer(data: Float32Array): AudioBuffer {
    const ctx = this.ensure();
    const buf = ctx.createBuffer(1, data.length, SR);
    buf.copyToChannel(data, 0);
    return buf;
  }

  private load(sound: SoundDef): Promise<AudioBuffer> {
    const key = sound.src;
    let p = this.buffers.get(key);
    if (!p) {
      p = (async () => {
        const ctx = this.ensure();
        try {
          const res = await fetch(sound.src);
          const type = res.headers.get('content-type') ?? '';
          if (!res.ok || type.includes('text/html')) throw new Error('missing');
          const decoded = await ctx.decodeAudioData(await res.arrayBuffer());
          this.origin.set(sound.id, 'file');
          return decoded;
        } catch {
          // 실제 파일이 없으면 절차적 사운드로 대체
          await new Promise((r) => setTimeout(r, 0));
          this.origin.set(sound.id, 'synth');
          return this.toBuffer(synthLoop(sound.synth));
        }
      })();
      this.buffers.set(key, p);
    }
    return p;
  }

  /** 월드 진입 시 미리 로드 */
  preload(sounds: SoundDef[]) {
    sounds.forEach((s) => void this.load(s));
  }

  private keyOf(worldId: string, s: SoundDef) {
    return `${worldId}/${s.id}`;
  }

  /**
   * 원하는 상태로 동기화 (멱등). 이 월드에 없는 채널은 모두 페이드아웃.
   */
  async sync(worldId: string | null, sounds: SoundDef[], state: Record<string, { on: boolean; volume: number }>, playing: boolean) {
    const ctx = this.ensure();
    const wanted = new Set<string>();
    if (worldId && playing) {
      for (const s of sounds) {
        const st = state[s.id];
        if (st?.on && st.volume > 0) wanted.add(this.keyOf(worldId, s));
      }
    }
    // stop
    for (const [key, ch] of this.channels) {
      if (!wanted.has(key)) this.stopChannel(key, ch);
    }
    if (!worldId) return;
    // start / update
    for (const s of sounds) {
      const key = this.keyOf(worldId, s);
      if (!wanted.has(key)) continue;
      const vol = curve(state[s.id].volume);
      const existing = this.channels.get(key);
      if (existing) {
        if (existing.gain) existing.gain.gain.setTargetAtTime(vol, ctx.currentTime, 0.08);
        continue;
      }
      const placeholder = {} as Channel;
      this.channels.set(key, placeholder);
      const buffer = await this.load(s);
      if (this.channels.get(key) !== placeholder) continue; // 그새 정지됨
      const gain = ctx.createGain();
      gain.gain.value = 0;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(gain).connect(this.master!);
      // 루프마다 시작 지점을 다르게 해서 자연스럽게
      source.start(0, Math.random() * buffer.duration);
      gain.gain.setTargetAtTime(curve(state[s.id].volume), ctx.currentTime, FADE / 3);
      this.channels.set(key, { source, gain });
    }
  }

  private stopChannel(key: string, ch: Channel) {
    this.channels.delete(key);
    if (!ch.source || !this.ctx) return;
    const t = this.ctx.currentTime;
    ch.gain.gain.cancelScheduledValues(t);
    ch.gain.gain.setTargetAtTime(0, t, FADE / 4);
    ch.source.stop(t + FADE * 1.5);
  }

  setVolume(worldId: string, sound: SoundDef, volume: number) {
    const ch = this.channels.get(this.keyOf(worldId, sound));
    if (ch?.gain && this.ctx) ch.gain.gain.setTargetAtTime(curve(volume), this.ctx.currentTime, 0.05);
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.1);
  }

  /** 짧은 인터랙션 효과음 */
  sfx(kind: SfxKind, volume = 0.5) {
    const ctx = this.ensure();
    if (this.muted) return;
    let buf = this.sfxBuffers.get(kind);
    if (!buf) {
      buf = this.toBuffer(synthSfx(kind));
      this.sfxBuffers.set(kind, buf);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = 0.92 + Math.random() * 0.16;
    const g = ctx.createGain();
    g.gain.value = volume;
    src.connect(g).connect(this.master!);
    src.start();
  }
}

export const audioEngine = new AudioEngine();
