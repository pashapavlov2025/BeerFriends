import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from './store/gameStore';
import { getBeerById, BEERS } from './data/beers';
import { UPGRADES, getUpgradeCost } from './data/upgrades';
import { ACHIEVEMENTS } from './data/achievements';
import { BREWERY_ROOMS } from './data/breweryRooms';
import { getCraftCost, MAX_RECIPES } from './data/recipes';
import { formatNumber } from './utils/formatNumber';
import { initSDK, gameplayStart, gameplayStop } from './utils/crazyGames';
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
          <li>⬆️ Buy upgrades & build rooms</li>
          <li>📖 Collect beers & craft recipes</li>
          <li>🏆 Earn achievements & gems</li>
          <li>💎 Spend gems in the shop</li>
          <li>⭐ Prestige for permanent bonuses</li>
        </ul>
        <div className="about-footer">v2.0.0 | Made with 🍺</div>
      </div>
    </div>
  );
}

function BreweryTab() {
  const { coins, tapPower, autoBrewRate, beersBrewed, currentBeer, prestigeLevel, prestigeMultiplier, boostMultiplier, autoTapEnabled, goldenSkin, tap, getRoomTapMultiplier, getRoomAutoMultiplier, recipes } = useGameStore();
  const beer = getBeerById(currentBeer);
  const recipe = recipes.find(r => r.id === currentBeer);
  const tapBonus = recipe ? recipe.tapBonus : beer.tapBonus;
  const autoBonus = recipe ? recipe.autoBonus : beer.autoBonus;
  const roomTapMult = getRoomTapMultiplier();
  const roomAutoMult = getRoomAutoMultiplier();
  const effectiveTap = tapPower * tapBonus * prestigeMultiplier * boostMultiplier * roomTapMult;
  const effectiveAuto = autoBrewRate * autoBonus * prestigeMultiplier * boostMultiplier * roomAutoMult;
  const [floats, setFloats] = useState<{ id: number; x: number; y: number }[]>([]);
  const [showAbout, setShowAbout] = useState(false);
  const nextId = useRef(0);

  const displayEmoji = recipe ? recipe.emoji : beer.emoji;
  const displayName = recipe ? recipe.name : beer.name;

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
      <button className="about-btn" onClick={() => setShowAbout(true)}>i</button>
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      <h2>🍺 BeerFriends Brewery</h2>
      {prestigeLevel > 0 && <div className="prestige-badge">⭐ Prestige {prestigeLevel}</div>}
      {boostMultiplier > 1 && <div className="boost-badge">🔥 {boostMultiplier}x Boost Active!</div>}
      {autoTapEnabled && <div className="autotap-badge">👆 Auto-Tap Active</div>}
      <div className="coins">🪙 {formatNumber(coins)}</div>
      {effectiveAuto > 0 && <div className="auto-rate">{formatNumber(effectiveAuto)}/sec</div>}
      <div className="beer-label">{displayEmoji} Brewing: {displayName}</div>
      <div className="tap-area" onClick={handleTap} onTouchStart={handleTap}>
        <button className={`brew-btn ${goldenSkin ? 'golden' : ''}`}>
          <span className="brew-emoji">{displayEmoji}</span>
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
  const { coins, upgrades, buyUpgrade, builtRooms, buildRoom } = useGameStore();
  const [section, setSection] = useState<'upgrades' | 'rooms'>('upgrades');
  return (
    <div className="tab-content">
      <h2>⬆️ Upgrades</h2>
      <div className="coins-bar">🪙 {formatNumber(coins)}</div>
      <div className="sub-tabs">
        <button className={section === 'upgrades' ? 'active' : ''} onClick={() => setSection('upgrades')}>Upgrades</button>
        <button className={section === 'rooms' ? 'active' : ''} onClick={() => setSection('rooms')}>Brewery Rooms</button>
      </div>
      {section === 'upgrades' && (
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
      )}
      {section === 'rooms' && (
        <div className="upgrade-list">
          {BREWERY_ROOMS.map(room => {
            const built = builtRooms.includes(room.id);
            const canBuy = coins >= room.cost && !built;
            return (
              <div key={room.id} className={`upgrade-card ${built ? 'built' : ''}`}>
                <div className="upgrade-info">
                  <span className="upgrade-emoji">{room.emoji}</span>
                  <div>
                    <div className="upgrade-name">{room.name} {built && <span className="level">BUILT</span>}</div>
                    <div className="upgrade-desc">{room.description}</div>
                  </div>
                </div>
                <button className={`buy-btn ${canBuy ? '' : 'disabled'}`} onClick={() => buildRoom(room.id)} disabled={!canBuy}>
                  {built ? '✅' : `🪙 ${formatNumber(room.cost)}`}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CollectionTab() {
  const { coins, unlockedBeers, currentBeer, unlockBeer, selectBeer, recipes, craftRecipe } = useGameStore();
  const [section, setSection] = useState<'beers' | 'crafting'>('beers');
  const [craft1, setCraft1] = useState<string | null>(null);
  const [craft2, setCraft2] = useState<string | null>(null);

  const craftCost = getCraftCost(recipes.length);
  const canCraft = craft1 && craft2 && craft1 !== craft2 && coins >= craftCost && recipes.length < MAX_RECIPES
    && !recipes.some(r => (r.parent1 === craft1 && r.parent2 === craft2) || (r.parent1 === craft2 && r.parent2 === craft1));

  const handleCraft = () => {
    if (craft1 && craft2 && canCraft) {
      craftRecipe(craft1, craft2);
      setCraft1(null);
      setCraft2(null);
    }
  };

  return (
    <div className="tab-content">
      <h2>📖 Collection</h2>
      <div className="coins-bar">🪙 {formatNumber(coins)}</div>
      <div className="sub-tabs">
        <button className={section === 'beers' ? 'active' : ''} onClick={() => setSection('beers')}>Beers</button>
        <button className={section === 'crafting' ? 'active' : ''} onClick={() => setSection('crafting')}>Crafting</button>
      </div>
      {section === 'beers' && (
        <>
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
          {recipes.length > 0 && (
            <>
              <h3 style={{ marginTop: 16 }}>🧪 Your Recipes</h3>
              <div className="beer-grid">
                {recipes.map(recipe => {
                  const active = currentBeer === recipe.id;
                  return (
                    <div key={recipe.id} className={`beer-card recipe-card ${active ? 'active' : ''}`}>
                      <span className="beer-emoji">{recipe.emoji}</span>
                      <div className="beer-name">{recipe.name}</div>
                      <div className="beer-bonus">Tap:{recipe.tapBonus}x Auto:{recipe.autoBonus}x</div>
                      {!active && <button className="select-btn" onClick={() => selectBeer(recipe.id)}>Select</button>}
                      {active && <span className="active-badge">ACTIVE</span>}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
      {section === 'crafting' && (
        <div className="crafting-section">
          <p className="info-text">Combine two beers to create a unique recipe with blended bonuses (+20% synergy).</p>
          <p className="info-text">Recipes: {recipes.length}/{MAX_RECIPES} | Cost: 🪙 {formatNumber(craftCost)}</p>
          <div className="craft-slots">
            <div className="craft-slot">
              <div className="craft-label">Beer 1</div>
              <div className="craft-options">
                {unlockedBeers.map(id => {
                  const beer = getBeerById(id);
                  return (
                    <button key={id} className={`craft-pick ${craft1 === id ? 'selected' : ''}`}
                      onClick={() => setCraft1(craft1 === id ? null : id)}>
                      {beer.emoji} {beer.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="craft-slot">
              <div className="craft-label">Beer 2</div>
              <div className="craft-options">
                {unlockedBeers.filter(id => id !== craft1).map(id => {
                  const beer = getBeerById(id);
                  return (
                    <button key={id} className={`craft-pick ${craft2 === id ? 'selected' : ''}`}
                      onClick={() => setCraft2(craft2 === id ? null : id)}>
                      {beer.emoji} {beer.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          {craft1 && craft2 && craft1 !== craft2 && (
            <div className="craft-preview">
              <span>🧪 {getBeerById(craft1).name} × {getBeerById(craft2).name}</span>
            </div>
          )}
          <button className={`buy-btn craft-btn ${canCraft ? '' : 'disabled'}`}
            onClick={handleCraft} disabled={!canCraft}>
            {recipes.length >= MAX_RECIPES ? 'Max Recipes' : `🧪 Craft — 🪙 ${formatNumber(craftCost)}`}
          </button>
        </div>
      )}
    </div>
  );
}

function AchievementsTab() {
  const { claimedAchievements, gems, claimAchievement, getAchievementProgress } = useGameStore();
  return (
    <div className="tab-content">
      <h2>🏆 Achievements</h2>
      <div className="coins-bar">💎 {gems} gems</div>
      <div className="upgrade-list">
        {ACHIEVEMENTS.map(a => {
          const claimed = claimedAchievements.includes(a.id);
          const progress = getAchievementProgress(a.condition);
          const ready = progress >= a.target && !claimed;
          const pct = Math.min(100, (progress / a.target) * 100);
          return (
            <div key={a.id} className={`upgrade-card achievement-card ${claimed ? 'claimed' : ''}`}>
              <div className="upgrade-info">
                <span className="upgrade-emoji">{claimed ? '✅' : a.emoji}</span>
                <div>
                  <div className="upgrade-name">{a.name}</div>
                  <div className="upgrade-desc">{a.description}</div>
                  {!claimed && (
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                      <span className="progress-text">{formatNumber(progress)}/{formatNumber(a.target)}</span>
                    </div>
                  )}
                  {claimed && <div className="upgrade-desc" style={{ color: '#86efac' }}>Claimed!</div>}
                </div>
              </div>
              <div className="achievement-rewards">
                {ready ? (
                  <button className="buy-btn" onClick={() => claimAchievement(a.id)}>Claim!</button>
                ) : !claimed ? (
                  <div className="reward-preview">
                    {a.reward > 0 && <span>🪙{formatNumber(a.reward)}</span>}
                    <span>💎{a.gemReward}</span>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ShopTab() {
  const { totalCoins, beersBrewed, prestigeLevel, prestigeMultiplier, gems, goldenSkin, autoTapEnabled, prestige, resetGame, buyGoldenSkin, buyAutoTap } = useGameStore();
  const canPrestige = totalCoins >= 10_000_000;

  return (
    <div className="tab-content">
      <h2>💎 Shop & Settings</h2>
      <div className="coins-bar">💎 {gems} gems</div>

      <div className="section">
        <h3>💎 Gem Shop</h3>
        <div className="shop-grid">
          <button className={`shop-item ${goldenSkin ? 'owned' : gems < 200 ? 'disabled' : ''}`}
            onClick={() => !goldenSkin && buyGoldenSkin()} disabled={goldenSkin || gems < 200}>
            <span className="shop-icon">✨</span>
            <span className="shop-name">{goldenSkin ? 'Owned' : 'Golden Skin'}</span>
            <span className="shop-price">💎 200</span>
          </button>
          <button className={`shop-item ${autoTapEnabled ? 'owned' : gems < 300 ? 'disabled' : ''}`}
            onClick={() => !autoTapEnabled && buyAutoTap()} disabled={autoTapEnabled || gems < 300}>
            <span className="shop-icon">👆</span>
            <span className="shop-name">{autoTapEnabled ? 'Owned' : 'Auto-Tap'}</span>
            <span className="shop-price">💎 300</span>
          </button>
        </div>
      </div>

      <div className="section">
        <h3>📊 Statistics</h3>
        <div className="stat-row"><span>Lifetime Coins</span><span>🪙 {formatNumber(totalCoins)}</span></div>
        <div className="stat-row"><span>Beers Brewed</span><span>🍺 {formatNumber(beersBrewed)}</span></div>
        <div className="stat-row"><span>Prestige Level</span><span>⭐ {prestigeLevel}</span></div>
        <div className="stat-row"><span>Multiplier</span><span>{prestigeMultiplier.toFixed(1)}x</span></div>
      </div>

      <div className="section">
        <h3>⭐ Prestige</h3>
        <p className="info-text">Earn 10M lifetime coins to prestige. +10% permanent earnings each time. Keeps achievements, recipes, rooms & gems.</p>
        <button className={`prestige-btn ${canPrestige ? '' : 'disabled'}`}
          onClick={() => { if (canPrestige && confirm('Reset progress for permanent +10% earnings? (Achievements, recipes, rooms & gems are kept)')) prestige(); }}
          disabled={!canPrestige}>
          {canPrestige ? '⭐ Prestige Now!' : 'Need 10M lifetime coins'}
        </button>
      </div>

      <div className="section">
        <button className="danger-btn" onClick={() => { if (confirm('Delete ALL progress including gems?')) resetGame(); }}>
          🗑️ Reset All Progress
        </button>
      </div>
      <div className="version">BeerFriends v2.0.0</div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<'brew' | 'upgrades' | 'collection' | 'achievements' | 'shop'>('brew');
  const { tick, saveGame, loadGame } = useGameStore();

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
    setTab(newTab);
  }, [tab]);

  return (
    <div className="app">
      <div className="screen">
        {tab === 'brew' && <BreweryTab />}
        {tab === 'upgrades' && <UpgradesTab />}
        {tab === 'collection' && <CollectionTab />}
        {tab === 'achievements' && <AchievementsTab />}
        {tab === 'shop' && <ShopTab />}
      </div>
      <nav className="tab-bar">
        <button className={tab === 'brew' ? 'active' : ''} onClick={() => handleTabSwitch('brew')}>🍺<span>Brew</span></button>
        <button className={tab === 'upgrades' ? 'active' : ''} onClick={() => handleTabSwitch('upgrades')}>⬆️<span>Upgrades</span></button>
        <button className={tab === 'collection' ? 'active' : ''} onClick={() => handleTabSwitch('collection')}>📖<span>Collect</span></button>
        <button className={tab === 'achievements' ? 'active' : ''} onClick={() => handleTabSwitch('achievements')}>🏆<span>Trophies</span></button>
        <button className={tab === 'shop' ? 'active' : ''} onClick={() => handleTabSwitch('shop')}>💎<span>Shop</span></button>
      </nav>
    </div>
  );
}
