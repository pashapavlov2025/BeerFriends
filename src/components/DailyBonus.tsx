import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { burstConfetti } from '../utils/effects';
import { playSfx } from '../utils/audio';
import { track } from '../utils/analytics';
import { formatNumber } from '../utils/formatNumber';

// Shows the daily-bonus modal on first mount if the player is eligible,
// plus a manual Claim button inside the modal.
export function DailyBonus() {
  const canClaimDaily = useGameStore(s => s.canClaimDaily);
  const claimDaily = useGameStore(s => s.claimDaily);
  const dailyStreak = useGameStore(s => s.dailyStreak);

  const [open, setOpen] = useState(false);
  const [reward, setReward] = useState<{ coins: number; gems: number; streak: number } | null>(null);

  useEffect(() => {
    // Delay a bit so it doesn't clash with idle-earnings alert.
    const t = setTimeout(() => {
      if (canClaimDaily()) {
        setOpen(true);
        track('daily_bonus_shown', { streak: dailyStreak });
      }
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!open) return null;

  const handleClaim = () => {
    const r = claimDaily();
    if (!r) { setOpen(false); return; }
    setReward(r);
    burstConfetti('medium');
    playSfx('achievement');
    track('daily_bonus_claimed', { streak: r.streak, coins: r.coins, gems: r.gems });
  };

  return (
    <div className="daily-overlay" onClick={() => reward && setOpen(false)}>
      <div className="daily-modal" onClick={e => e.stopPropagation()}>
        {!reward ? (
          <>
            <div className="daily-icon">🎁</div>
            <h2>Daily Brew Bonus!</h2>
            <p className="daily-sub">Welcome back, brewer. Claim your daily reward!</p>
            {dailyStreak > 0 && <div className="daily-streak">🔥 Day {dailyStreak + 1} streak</div>}
            <button className="daily-claim-btn" onClick={handleClaim}>Claim Bonus</button>
          </>
        ) : (
          <>
            <div className="daily-icon">🍺</div>
            <h2>You got:</h2>
            <div className="daily-rewards">
              <div className="daily-reward-row">🪙 {formatNumber(reward.coins)}</div>
              <div className="daily-reward-row">💎 {reward.gems}</div>
              <div className="daily-streak">🔥 Streak: {reward.streak} day{reward.streak === 1 ? '' : 's'}</div>
            </div>
            <button className="daily-claim-btn" onClick={() => setOpen(false)}>Cheers!</button>
          </>
        )}
      </div>
    </div>
  );
}
