import { audioEngine } from '../audio/AudioEngine';
import { useSoundStore } from '../hooks/useSoundStore';
import { MuteIcon, SoundOnIcon } from './Icons';

export function MuteButton() {
  const { muted, toggleMute } = useSoundStore();
  return (
    <button
      className={`icon-btn ${muted ? 'is-muted' : ''}`}
      onClick={() => {
        audioEngine.unlock();
        toggleMute();
      }}
      aria-label={muted ? '음소거 해제' : '전체 음소거'}
      title={muted ? '음소거 해제' : '전체 음소거'}
    >
      {muted ? <MuteIcon /> : <SoundOnIcon />}
    </button>
  );
}
