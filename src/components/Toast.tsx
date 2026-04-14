import { useEffect, useState } from 'react';

// Lightweight toast listener. Any part of the app can fire a toast by
// dispatching a `bf-toast` CustomEvent with { title, message, emoji } on
// window. Shown for ~4.5s with a fade-out, dismissible by tap.
type ToastEvent = {
  title?: string;
  message: string;
  emoji?: string;
};

type Queued = ToastEvent & { id: number; state: 'show' | 'hide' };

export function Toast() {
  const [queue, setQueue] = useState<Queued[]>([]);

  useEffect(() => {
    let nextId = 0;
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent<ToastEvent>).detail;
      if (!detail || !detail.message) return;
      const id = ++nextId;
      setQueue(q => [...q, { ...detail, id, state: 'show' }]);
      window.setTimeout(() => {
        setQueue(q => q.map(t => t.id === id ? { ...t, state: 'hide' } : t));
      }, 4000);
      window.setTimeout(() => {
        setQueue(q => q.filter(t => t.id !== id));
      }, 4500);
    };
    window.addEventListener('bf-toast', onToast);
    return () => window.removeEventListener('bf-toast', onToast);
  }, []);

  if (queue.length === 0) return null;
  return (
    <div className="toast-container">
      {queue.map(t => (
        <button
          key={t.id}
          className={`toast toast--${t.state}`}
          onClick={() => setQueue(q => q.filter(x => x.id !== t.id))}
        >
          {t.emoji && <span className="toast-emoji">{t.emoji}</span>}
          <span className="toast-body">
            {t.title && <strong className="toast-title">{t.title}</strong>}
            <span className="toast-message">{t.message}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
