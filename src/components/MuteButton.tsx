import { useEffect, useState } from 'react';
import { isMuted, toggleMute, subscribeMute } from '../utils/audio';

export function MuteButton() {
  const [muted, setMuted] = useState(isMuted());
  useEffect(() => subscribeMute(setMuted), []);
  return (
    <button
      className="mute-btn"
      onClick={toggleMute}
      aria-label={muted ? 'Unmute sound' : 'Mute sound'}
      title={muted ? 'Unmute' : 'Mute'}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}
