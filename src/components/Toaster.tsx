import { useStore } from '../store/createStore';
import { toastStore } from '../store/toast';

export function Toaster() {
  const toasts = useStore(toastStore, (t) => t);
  return (
    <div className="toaster" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          {t.icon && <span className="toast__icon">{t.icon}</span>}
          {t.text}
        </div>
      ))}
    </div>
  );
}
