const base = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export const PlayIcon = () => (
  <svg {...base} fill="currentColor" stroke="none">
    <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
  </svg>
);
export const PauseIcon = () => (
  <svg {...base} fill="currentColor" stroke="none">
    <rect x="6" y="5" width="4.2" height="14" rx="1.6" />
    <rect x="13.8" y="5" width="4.2" height="14" rx="1.6" />
  </svg>
);
export const SoundOnIcon = () => (
  <svg {...base}>
    <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor" />
    <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
  </svg>
);
export const MuteIcon = () => (
  <svg {...base}>
    <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor" />
    <path d="M16 9.5l5 5M21 9.5l-5 5" />
  </svg>
);
export const ChevronLeft = () => (
  <svg {...base}>
    <path d="M14.5 6l-6 6 6 6" />
  </svg>
);
export const ChevronRight = () => (
  <svg {...base}>
    <path d="M9.5 6l6 6-6 6" />
  </svg>
);
export const ChevronUp = () => (
  <svg {...base}>
    <path d="M6 14.5l6-6 6 6" />
  </svg>
);
export const MapIcon = () => (
  <svg {...base}>
    <path d="M9 4.5 3.5 6.8v12.7L9 17.2l6 2.3 5.5-2.3V4.5L15 6.8z" />
    <path d="M9 4.5v12.7M15 6.8v12.7" />
  </svg>
);
export const ResetIcon = () => (
  <svg {...base} width={16} height={16}>
    <path d="M4 12a8 8 0 1 0 2.4-5.7" />
    <path d="M4 4.5v4h4" />
  </svg>
);
