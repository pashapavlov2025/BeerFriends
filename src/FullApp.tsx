import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Alert, AppState, AppStateStatus, Platform } from 'react-native';
import TabNavigator from './navigation/TabNavigator';
import { useGameStore } from './store/gameStore';
import { formatNumber } from './utils/formatNumber';
import { GAME_CONSTANTS } from './data/constants';

function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

function GameLoop() {
  const tick = useGameStore((s) => s.tick);
  const saveGame = useGameStore((s) => s.saveGame);
  const loadGame = useGameStore((s) => s.loadGame);
  const calculateIdleEarnings = useGameStore((s) => s.calculateIdleEarnings);
  const addAutoBrewEarnings = useGameStore((s) => s.addAutoBrewEarnings);
  const lastOnlineAt = useGameStore((s) => s.lastOnlineAt);
  const [loaded, setLoaded] = useState(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    loadGame().then(() => setLoaded(true)).catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      const earnings = calculateIdleEarnings();
      if (earnings > 0) {
        addAutoBrewEarnings((Date.now() - lastOnlineAt) / 1000);
        showAlert('🍺 Welcome Back!', `Your brewery earned 🪙 ${formatNumber(earnings)} while you were away!`);
      }
    } catch {}
  }, [loaded]);

  useEffect(() => {
    const interval = setInterval(tick, GAME_CONSTANTS.TICK_INTERVAL);
    return () => clearInterval(interval);
  }, [tick]);

  useEffect(() => {
    const interval = setInterval(saveGame, GAME_CONSTANTS.AUTO_SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [saveGame]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current === 'active' && nextState.match(/inactive|background/)) saveGame();
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        const earnings = calculateIdleEarnings();
        if (earnings > 100) {
          addAutoBrewEarnings((Date.now() - lastOnlineAt) / 1000);
          showAlert('🍺 Welcome Back!', `Your brewery earned 🪙 ${formatNumber(earnings)} while you were away!`);
        }
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, []);

  return null;
}

export default function FullApp() {
  return (
    <NavigationContainer
      documentTitle={{ formatter: () => 'BeerFriends: Brewery Tycoon' }}
    >
      <GameLoop />
      <TabNavigator />
    </NavigationContainer>
  );
}
