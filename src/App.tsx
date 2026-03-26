import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from './store/gameStore';
import { getBeerById, BEERS } from './data/beers';
import { UPGRADES, getUpgradeCost } from './data/upgrades';
import { formatNumber } from './utils/formatNumber';
import { initSDK, gameplayStart, gameplayStop, showMidgameAd, showRewardedAd } from './utils/crazyGames';
import './app.css';

function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="about-overlay" onClick={onClose}>
      <div className="about-modal" onClick={e => e.stopPropagation()}>
        <button className="about-close" onClick={onClose}>✕</button>
        <h2>🍺 BeerFriends: Brewery Tycoon</h2>
        <p>Build your beer empire from scratch! Tap to brew, upgrade your equipment, collect rare beer recipes, and become the ultimate Brewery Tycoon.</p>
        <ul>
          <li>🍺 Tap to brew and earn coins</li>
          <li>⬆️ Buy upgrades to boost production</li>
          <li>📖 Collect 6 unique beer types</li>
          <li>⭐ Prestige for permanent bonuses</li>
          <li>🎬 Watch ads for free rewards</li>
        </ul>
        <div className="about-footer">v1.0.0 | Made with 🍺</div>
      </div>
    </div>
  );
}

function BreweryTab() {
  const { coins, tapPower, autoBrewRate, beersBrewed, currentBeer, prestigeLevel, prestigeMultiplier, boostMultiplier, tap } = useGameStore();
  const beer = getBeerById(currentBeer);
  const effectiveTap = tapPower * beer.tapBonus * prestigeMultiplier * boostMultiplier;
  const effectiveAuto = autoBrewRate * beer.autoBonus * prestigeMultiplier * boostMultiplier;
  const [floats, setFloats] = useState<{ id: number; x: number; y: number }[]>([]);
  const [showAbout, setShowAbout] = useState(false);
  const nextId = useRef(0);

  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    tap();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]?.clientX ?? rect.left + rect.width / 2 : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY ?? rect.top : e.clientY;
    const id = ++nextId.current;
    setFloats(f => [...f.slice(-5), { id, x: clientX - rect.left, y: clientY - rect.top }]);
    setTimeout(() => setFloats(f => f.filter(v => v.id !== id)), 800);
  }, [tap]);

  return (
    <div className="tab-content brewery">
      <button className="about-btn" onClick={() => setShowAbout(true)}>ℹ️</button>
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      <h2>🍺 BeerFriends Brewery</h2>
      {prestigeLevel > 0 && <div className="prestige-badge">⭐ Prestige {prestigeLevel}</div>}
      {boostMultiplier > 1 && <div className="boost-badge">🔥 {boostMultiplier}x Boost Active!</div>}
      <div className="coins">🪙 {formatNumber(coins)}</div>
      {effectiveAuto > 0 && <div className="auto-rate">{formatNumber(effectiveAuto)}/sec</div>}
      <div className="beer-label">{beer.emoji} Brewing: {beer.name}</div>
      <div className="tap-area" onClick={handleTap} onTouchStart={handleTap}>
        <button className="brew-btn">
          <span className="brew-emoji">{beer.emoji}</span>
          <span className="brew-text">TAP TO BREW</span>
          <span className="brew-power">+{formatNumber(effectiveTap)}/tap</span>
        </button>
        {floats.map(f => (
          <span key={f.id} className="float-text" style={{ left: f.x, top: f.y }}>
            +{formatNumber(effectiveTap)}
          </span>
        ))}
      </div>
      <div className="stat-line">🍺 Beers brewed: {formatNumber(beersBrewed)}</div>
    </div>
  );
}

function UpgradesTab() {
  const { coins, upgrades, buyUpgrade } = useGameStore();
  return (
    <div className="tab-content">
      <h2>⬆️ Upgrades</h2>
      <div className="coins-bar">🪙 {formatNumber(coins)}</div>
      <div className="upgrade-list">
        {UPGRADES.map(u => {
          const level = upgrades[u.id] ?? 0;
          const cost = getUpgradeCost(u, level);
          const maxed = level >= u.maxLevel;
          const canBuy = coins >= cost && !maxed;
          return (
            <div key={u.id} className="upgrade-card">
              <div className="upgrade-info">
                <span className="upgrade-emoji">{u.emoji}</span>
                <div>
                  <div className="upgrade-name">{u.name} <span className="level">Lv.{level}</span></div>
                  <div className="upgrade-desc">{u.description}</div>
                </div>
              </div>
              <button className={`buy-btn ${canBuy ? '' : 'disabled'}`} onClick={() => buyUpgrade(u.id)} disabled={!canBuy}>
                {maxed ? 'MAX' : `🪙 ${formatNumber(cost)}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CollectionTab() {
  const { coins, unlockedBeers, currentBeer, unlockBeer, selectBeer } = useGameStore();
  return (
    <div className="tab-content">
      <h2>📖 Beer Collection</h2>
      <div className="coins-bar">🪙 {formatNumber(coins)}</div>
      <div className="beer-grid">
        {BEERS.map(beer => {
          const unlocked = unlockedBeers.includes(beer.id);
          const active = currentBeer === beer.id;
          return (
            <div key={beer.id} className={`beer-card ${active ? 'active' : ''} ${!unlocked ? 'locked' : ''}`}>
              <span className="beer-emoji">{unlocked ? beer.emoji : '🔒'}</span>
              <div className="beer-name">{beer.name}</div>
              {unlocked && <div className="beer-bonus">Tap:{beer.tapBonus}x Auto:{beer.autoBonus}x</div>}
              {unlocked && !active && <button className="select-btn" onClick={() => selectBeer(beer.id)}>Select</button>}
              {unlocked && active && <span className="active-badge">ACTIVE</span>}
              {!unlocked && (
                <button className={`unlock-btn ${coins >= beer.unlockCost ? '' : 'disabled'}`}
                  onClick={() => unlockBeer(beer.id)} disabled={coins < beer.unlockCost}>
                  🪙 {formatNumber(beer.unlockCost)}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SettingsTab() {
  const { totalCoins, beersBrewed, prestigeLevel, prestigeMultiplier, prestige, resetGame } = useGameStore();
  const [adBoost, setAdBoost] = useState(false);
  const canPrestige = totalCoins >= 1_000_000;

  const handleRewardedAd = async (reward: 'coins' | 'boost') => {
    const watched = await showRewardedAd();
    if (!watched) return;
    if (reward === 'coins') {
      const bonus = Math.max(1000, Math.floor(totalCoins * 0.05));
      useGameStore.getState().addCoins(bonus);
      alert(`🎉 You earned ${formatNumber(bonus)} bonus coins!`);
    } else {
      setAdBoost(true);
      useGameStore.getState().setBoostMultiplier(2);
      setTimeout(() => {
        setAdBoost(false);
        useGameStore.getState().setBoostMultiplier(1);
      }, 30 * 60 * 1000);
    }
  };

  return (
    <div className="tab-content">
      <h2>⚙️ Settings</h2>
      <div className="section">
        <h3>📊 Statistics</h3>
        <div className="stat-row"><span>Lifetime Coins</span><span>🪙 {formatNumber(totalCoins)}</span></div>
        <div className="stat-row"><span>Beers Brewed</span><span>🍺 {formatNumber(beersBrewed)}</span></div>
        <div className="stat-row"><span>Prestige Level</span><span>⭐ {prestigeLevel}</span></div>
        <div className="stat-row"><span>Multiplier</span><span>{prestigeMultiplier.toFixed(1)}x</span></div>
      </div>
      <div className="section">
        <h3>⭐ Prestige</h3>
        <p className="info-text">Earn 1M lifetime coins to prestige. +10% permanent earnings each time.</p>
        <button className={`prestige-btn ${canPrestige ? '' : 'disabled'}`}
          onClick={() => { if (canPrestige && confirm('Reset all progress for permanent +10% earnings?')) prestige(); }}
          disabled={!canPrestige}>
          {canPrestige ? '⭐ Prestige Now!' : `Need 1M lifetime coins`}
        </button>
      </div>
      <div className="section">
        <h3>🎬 Free Rewards</h3>
        <button className="shop-btn reward-btn" onClick={() => handleRewardedAd('coins')}>
          🎬 Watch Ad → Free Coins
        </button>
        <button className={`shop-btn reward-btn ${adBoost ? 'disabled' : ''}`}
          onClick={() => !adBoost && handleRewardedAd('boost')}
          disabled={adBoost}>
          {adBoost ? '🔥 2x Boost Active!' : '🎬 Watch Ad → 2x Earnings (30min)'}
        </button>
      </div>
      <div className="section">
        <button className="danger-btn" onClick={() => { if (confirm('Delete ALL progress?')) resetGame(); }}>
          🗑️ Reset All Progress
        </button>
      </div>
      <div className="version">BeerFriends v1.0.0</div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<'brew' | 'upgrades' | 'collection' | 'settings'>('brew');
  const { tick, saveGame, loadGame } = useGameStore();
  const tabSwitchCount = useRef(0);

  useEffect(() => {
    initSDK();
    loadGame();
    gameplayStart();
    const handleVisibility = () => {
      if (document.hidden) { gameplayStop(); saveGame(); }
      else gameplayStart();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => { const i = setInterval(tick, 1000); return () => clearInterval(i); }, [tick]);
  useEffect(() => { const i = setInterval(saveGame, 5000); return () => clearInterval(i); }, [saveGame]);

  const handleTabSwitch = useCallback((newTab: typeof tab) => {
    if (newTab === tab) return;
    tabSwitchCount.current++;
    // Show midgame ad every 5 tab switches
    if (tabSwitchCount.current % 5 === 0) {
      showMidgameAd().then(() => setTab(newTab));
    } else {
      setTab(newTab);
    }
  }, [tab]);

  return (
    <div className="app">
      <div className="screen">
        {tab === 'brew' && <BreweryTab />}
        {tab === 'upgrades' && <UpgradesTab />}
        {tab === 'collection' && <CollectionTab />}
        {tab === 'settings' && <SettingsTab />}
      </div>
      <nav className="tab-bar">
        <button className={tab === 'brew' ? 'active' : ''} onClick={() => handleTabSwitch('brew')}>🍺<span>Brewery</span></button>
        <button className={tab === 'upgrades' ? 'active' : ''} onClick={() => handleTabSwitch('upgrades')}>⬆️<span>Upgrades</span></button>
        <button className={tab === 'collection' ? 'active' : ''} onClick={() => handleTabSwitch('collection')}>📖<span>Collection</span></button>
        <button className={tab === 'settings' ? 'active' : ''} onClick={() => handleTabSwitch('settings')}>⚙️<span>Settings</span></button>
      </nav>
    </div>
  );
}
