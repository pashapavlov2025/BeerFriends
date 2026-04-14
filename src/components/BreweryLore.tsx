import { useEffect, useState } from 'react';

// Fun brewery facts shown as a 5-second "lore break" (fallback for rewarded ads
// on platforms without ad SDKs — e.g. itch.io, direct web, dev preview).
const LORE_FACTS = [
  { emoji: '🍺', title: 'Did You Know?', text: 'The oldest known recipe for beer is over 3,900 years old, from ancient Sumeria.' },
  { emoji: '🌾', title: 'Brewing 101', text: 'Beer is made from just four basic ingredients: water, malted grain, hops, and yeast.' },
  { emoji: '👑', title: 'Royal Brew', text: 'Queen Elizabeth I drank beer for breakfast — it was safer than water back then.' },
  { emoji: '🇩🇪', title: 'Oktoberfest', text: 'The world\'s biggest beer festival serves over 7 million liters every year in Munich.' },
  { emoji: '🍻', title: 'Cheers!', text: 'Clinking glasses was believed to scare away evil spirits hiding in the brew.' },
  { emoji: '🔬', title: 'Yeast Magic', text: 'Yeast eats sugar and produces alcohol and CO₂ — the tiny bubbles in your beer.' },
  { emoji: '🌿', title: 'Hops Power', text: 'Hops are cousins of cannabis — both belong to the Cannabaceae plant family.' },
  { emoji: '🏛️', title: 'Ancient Pay', text: 'Workers who built the Egyptian pyramids were paid partly in beer rations.' },
  { emoji: '⚗️', title: 'Pure Law', text: 'Germany\'s Reinheitsgebot (1516) legally limited beer to water, barley, and hops.' },
  { emoji: '🍞', title: 'Liquid Bread', text: 'Medieval monks called beer "liquid bread" and drank it during Lent fasting.' },
];

type LoreRequest = {
  reason: string;
  reward: string;
  resolve: (claimed: boolean) => void;
};

let currentRequest: LoreRequest | null = null;
let listener: ((req: LoreRequest | null) => void) | null = null;

export function requestLoreBreak(reason: string, reward: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (currentRequest) { resolve(false); return; }
    currentRequest = { reason, reward, resolve };
    listener?.(currentRequest);
  });
}

export function BreweryLoreHost() {
  const [req, setReq] = useState<LoreRequest | null>(null);
  const [fact] = useState(() => LORE_FACTS[Math.floor(Math.random() * LORE_FACTS.length)]);
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [currentFact, setCurrentFact] = useState(fact);

  useEffect(() => {
    listener = (r) => {
      setReq(r);
      if (r) {
        setSecondsLeft(5);
        setCurrentFact(LORE_FACTS[Math.floor(Math.random() * LORE_FACTS.length)]);
      }
    };
    return () => { listener = null; };
  }, []);

  useEffect(() => {
    if (!req) return;
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [req, secondsLeft]);

  if (!req) return null;

  const finish = (claimed: boolean) => {
    const r = currentRequest;
    currentRequest = null;
    setReq(null);
    r?.resolve(claimed);
  };

  return (
    <div className="lore-overlay">
      <div className="lore-modal">
        <div className="lore-header">
          <span className="lore-pill">Brewery Lore</span>
          <button
            className="lore-skip"
            onClick={() => finish(false)}
            disabled={secondsLeft > 0}
            title={secondsLeft > 0 ? `Wait ${secondsLeft}s` : 'Skip'}
          >
            {secondsLeft > 0 ? `${secondsLeft}s` : '✕ Skip'}
          </button>
        </div>
        <div className="lore-emoji">{currentFact.emoji}</div>
        <h3 className="lore-title">{currentFact.title}</h3>
        <p className="lore-text">{currentFact.text}</p>
        <div className="lore-reward">Reward: <strong>{req.reward}</strong></div>
        <button
          className={`lore-claim ${secondsLeft > 0 ? 'disabled' : ''}`}
          onClick={() => finish(true)}
          disabled={secondsLeft > 0}
        >
          {secondsLeft > 0 ? `Claim in ${secondsLeft}s…` : `🍺 Claim ${req.reward}`}
        </button>
      </div>
    </div>
  );
}
