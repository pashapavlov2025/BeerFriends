import { useGameStore } from '../src/store/gameStore';

// Reset store before each test
beforeEach(() => {
  useGameStore.setState({
    coins: 0,
    totalCoins: 0,
    tapPower: 1,
    autoBrewRate: 0,
    beersBrewed: 0,
    upgrades: {},
    unlockedBeers: ['lager'],
    currentBeer: 'lager',
    prestigeLevel: 0,
    prestigeMultiplier: 1,
    lastOnlineAt: Date.now(),
  });
});

describe('tap()', () => {
  it('adds tapPower coins on tap', () => {
    useGameStore.getState().tap();
    const state = useGameStore.getState();
    expect(state.coins).toBe(1); // base tapPower=1, lager tapBonus=1, prestige=1
    expect(state.totalCoins).toBe(1);
    expect(state.beersBrewed).toBe(1);
  });

  it('applies beer tapBonus', () => {
    // Unlock and select ale (tapBonus: 1.5)
    useGameStore.setState({ coins: 1000, unlockedBeers: ['lager', 'ale'], currentBeer: 'ale' });
    useGameStore.getState().tap();
    expect(useGameStore.getState().coins).toBe(1001.5); // 1000 + 1*1.5
  });

  it('applies prestige multiplier', () => {
    useGameStore.setState({ prestigeMultiplier: 2 });
    useGameStore.getState().tap();
    expect(useGameStore.getState().coins).toBe(2); // 1 * 1 * 2
  });

  it('accumulates multiple taps', () => {
    for (let i = 0; i < 10; i++) useGameStore.getState().tap();
    expect(useGameStore.getState().coins).toBe(10);
    expect(useGameStore.getState().beersBrewed).toBe(10);
  });
});

describe('tick()', () => {
  it('does nothing when autoBrewRate is 0', () => {
    useGameStore.getState().tick();
    expect(useGameStore.getState().coins).toBe(0);
  });

  it('adds autoBrewRate coins per tick', () => {
    useGameStore.setState({ autoBrewRate: 5 });
    useGameStore.getState().tick();
    expect(useGameStore.getState().coins).toBe(5);
    expect(useGameStore.getState().totalCoins).toBe(5);
  });

  it('applies beer autoBonus and prestige', () => {
    useGameStore.setState({
      autoBrewRate: 10,
      currentBeer: 'ale', // autoBonus: 1.2
      unlockedBeers: ['lager', 'ale'],
      prestigeMultiplier: 1.5,
    });
    useGameStore.getState().tick();
    expect(useGameStore.getState().coins).toBeCloseTo(18); // 10 * 1.2 * 1.5
  });
});

describe('buyUpgrade()', () => {
  it('buys upgrade when enough coins', () => {
    useGameStore.setState({ coins: 100 });
    useGameStore.getState().buyUpgrade('better_tap'); // cost=10
    const state = useGameStore.getState();
    expect(state.coins).toBe(90);
    expect(state.upgrades['better_tap']).toBe(1);
    expect(state.tapPower).toBe(2); // base(1) + 1*1
  });

  it('refuses if not enough coins', () => {
    useGameStore.setState({ coins: 5 });
    useGameStore.getState().buyUpgrade('better_tap'); // cost=10
    expect(useGameStore.getState().coins).toBe(5);
    expect(useGameStore.getState().upgrades['better_tap']).toBeUndefined();
  });

  it('increases cost with level', () => {
    useGameStore.setState({ coins: 10000 });
    useGameStore.getState().buyUpgrade('better_tap'); // lv0→1, cost=10
    const coinsAfterFirst = useGameStore.getState().coins;
    expect(coinsAfterFirst).toBe(9990);

    useGameStore.getState().buyUpgrade('better_tap'); // lv1→2, cost=floor(10*1.15)=11
    expect(useGameStore.getState().coins).toBe(9979);
    expect(useGameStore.getState().upgrades['better_tap']).toBe(2);
  });

  it('increases autoBrewRate for auto upgrades', () => {
    useGameStore.setState({ coins: 1000 });
    useGameStore.getState().buyUpgrade('auto_brewer'); // baseEffect=0.5
    expect(useGameStore.getState().autoBrewRate).toBe(0.5);
  });
});

describe('unlockBeer()', () => {
  it('unlocks beer when enough coins', () => {
    useGameStore.setState({ coins: 1000 });
    useGameStore.getState().unlockBeer('ale'); // cost=500
    const state = useGameStore.getState();
    expect(state.coins).toBe(500);
    expect(state.unlockedBeers).toContain('ale');
  });

  it('refuses if not enough coins', () => {
    useGameStore.setState({ coins: 100 });
    useGameStore.getState().unlockBeer('ale'); // cost=500
    expect(useGameStore.getState().unlockedBeers).not.toContain('ale');
  });

  it('does not double-unlock', () => {
    useGameStore.setState({ coins: 10000, unlockedBeers: ['lager', 'ale'] });
    useGameStore.getState().unlockBeer('ale');
    expect(useGameStore.getState().coins).toBe(10000); // no cost deducted
  });
});

describe('selectBeer()', () => {
  it('selects unlocked beer', () => {
    useGameStore.setState({ unlockedBeers: ['lager', 'ale'] });
    useGameStore.getState().selectBeer('ale');
    expect(useGameStore.getState().currentBeer).toBe('ale');
  });

  it('does not select locked beer', () => {
    useGameStore.getState().selectBeer('imperial');
    expect(useGameStore.getState().currentBeer).toBe('lager');
  });
});

describe('prestige()', () => {
  it('resets and increases multiplier when enough totalCoins', () => {
    useGameStore.setState({ totalCoins: 2_000_000, coins: 500_000 });
    useGameStore.getState().prestige();
    const state = useGameStore.getState();
    expect(state.coins).toBe(0);
    expect(state.prestigeLevel).toBe(1);
    expect(state.prestigeMultiplier).toBeCloseTo(1.1);
    expect(state.upgrades).toEqual({});
    expect(state.unlockedBeers).toEqual(['lager']);
  });

  it('refuses prestige below threshold', () => {
    useGameStore.setState({ totalCoins: 500_000, coins: 500_000 });
    useGameStore.getState().prestige();
    expect(useGameStore.getState().prestigeLevel).toBe(0);
    expect(useGameStore.getState().coins).toBe(500_000);
  });

  it('stacks prestige levels', () => {
    useGameStore.setState({ totalCoins: 2_000_000 });
    useGameStore.getState().prestige();
    // After first prestige, set totalCoins high again
    useGameStore.setState({ totalCoins: 2_000_000 });
    useGameStore.getState().prestige();
    const state = useGameStore.getState();
    expect(state.prestigeLevel).toBe(2);
    expect(state.prestigeMultiplier).toBeCloseTo(1.2);
  });
});

describe('resetGame()', () => {
  it('resets everything to initial state', () => {
    useGameStore.setState({
      coins: 99999,
      totalCoins: 99999,
      prestigeLevel: 5,
      upgrades: { better_tap: 10 },
      unlockedBeers: ['lager', 'ale', 'stout'],
    });
    useGameStore.getState().resetGame();
    const state = useGameStore.getState();
    expect(state.coins).toBe(0);
    expect(state.prestigeLevel).toBe(0);
    expect(state.prestigeMultiplier).toBe(1);
    expect(state.upgrades).toEqual({});
    expect(state.unlockedBeers).toEqual(['lager']);
  });
});
