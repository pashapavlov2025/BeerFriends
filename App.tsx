import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { Alert, AppState, AppStateStatus, Platform } from 'react-native';
import TabNavigator from './src/navigation/TabNavigator';
import { useGameStore } from './src/store/gameStore';
import { formatNumber } from './src/utils/formatNumber';
import { GAME_CONSTANTS } from './src/data/constants';

const linking = {
  prefixes: [],
  config: {
    screens: {
      Brewery: '',
      Upgrades: 'upgrades',
      Collection: 'collection',
      Settings: 'settings',
    },
  },
};

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

  // Load game on mount
  useEffect(() => {
    loadGame().then(() => setLoaded(true));
  }, []);

  // Show idle earnings after load
  useEffect(() => {
    if (!loaded) return;
    const earnings = calculateIdleEarnings();
    if (earnings > 0) {
      addAutoBrewEarnings((Date.now() - lastOnlineAt) / 1000);
      showAlert(
        '🍺 Welcome Back!',
        `Your brewery earned 🪙 ${formatNumber(earnings)} while you were away!`
      );
    }
  }, [loaded]);

  // Auto-brew tick every second
  useEffect(() => {
    const interval = setInterval(tick, GAME_CONSTANTS.TICK_INTERVAL);
    return () => clearInterval(interval);
  }, [tick]);

  // Auto-save periodically
  useEffect(() => {
    const interval = setInterval(saveGame, GAME_CONSTANTS.AUTO_SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [saveGame]);

  // Save on background, load idle earnings on foreground
  useEffect(() => {
    if (Platform.OS === 'web') return; // AppState not reliable on web
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current === 'active' && nextState.match(/inactive|background/)) {
        saveGame();
      }
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        const earnings = calculateIdleEarnings();
        if (earnings > 100) {
          addAutoBrewEarnings((Date.now() - lastOnlineAt) / 1000);
          showAlert(
            '🍺 Welcome Back!',
            `Your brewery earned 🪙 ${formatNumber(earnings)} while you were away!`
          );
        }
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, []);

  return null;
}

export default function App() {
  return (
    <NavigationContainer linking={linking}>
      <StatusBar style="light" />
      <GameLoop />
      <TabNavigator />
    </NavigationContainer>
  );
}
