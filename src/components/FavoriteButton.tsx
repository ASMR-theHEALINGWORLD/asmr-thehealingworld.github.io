import { toast } from '../store/toast';
import { useUser, userActions } from '../store/userStore';

export function FavoriteButton({ worldId, title }: { worldId: string; title: string }) {
  const fav = useUser((u) => u.favorites.includes(worldId));
  return (
    <button
      className={`icon-btn fav-btn ${fav ? 'is-on' : ''}`}
      aria-pressed={fav}
      aria-label={fav ? '즐겨찾기 해제' : '즐겨찾기'}
      title={fav ? '즐겨찾기 해제' : '즐겨찾기'}
      onClick={() => {
        userActions.toggleFavorite(worldId);
        if (!fav) toast(`${title}을(를) 즐겨찾기했어요`, '♥');
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
        <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
      </svg>
    </button>
  );
}

export function MeButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="icon-btn" onClick={onClick} aria-label="마이 힐링" title="마이 힐링">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="8.5" r="3.6" />
        <path d="M4.8 20c1.2-3.6 4-5.4 7.2-5.4s6 1.8 7.2 5.4" />
      </svg>
    </button>
  );
}
