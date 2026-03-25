import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import CoinDisplay from '../components/CoinDisplay';
import BrewButton from '../components/BrewButton';
import FloatingText from '../components/FloatingText';
import { useGameStore } from '../store/gameStore';
import { getBeerById } from '../data/beers';
import { formatNumber } from '../utils/formatNumber';
import { COLORS } from '../data/constants';

interface FloatingItem {
  id: number;
  value: string;
  x: number;
  y: number;
}

let floatingId = 0;

export default function BreweryScreen() {
  const [floatingTexts, setFloatingTexts] = useState<FloatingItem[]>([]);
  const beersBrewed = useGameStore((s) => s.beersBrewed);
  const currentBeer = useGameStore((s) => s.currentBeer);
  const prestigeLevel = useGameStore((s) => s.prestigeLevel);

  const beer = getBeerById(currentBeer);

  const handleTapAt = useCallback((x: number, y: number, value: number) => {
    const id = ++floatingId;
    setFloatingTexts((prev) => [
      ...prev.slice(-5), // keep max 6 floating texts
      { id, value: `+${formatNumber(value)}`, x, y },
    ]);
  }, []);

  const removeFloating = useCallback((id: number) => {
    setFloatingTexts((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🍺 BeerFriends Brewery</Text>
        {prestigeLevel > 0 && (
          <Text style={styles.prestige}>⭐ Prestige {prestigeLevel}</Text>
        )}
      </View>

      <CoinDisplay />

      <View style={styles.beerInfo}>
        <Text style={styles.beerName}>
          {beer.emoji} Brewing: {beer.name}
        </Text>
      </View>

      <View style={styles.tapArea}>
        <BrewButton onTapAt={handleTapAt} />
        {floatingTexts.map((f) => (
          <FloatingText
            key={f.id}
            value={f.value}
            x={f.x + 80}
            y={f.y + 40}
            onComplete={() => removeFloating(f.id)}
          />
        ))}
      </View>

      <View style={styles.stats}>
        <Text style={styles.statText}>
          🍺 Beers brewed: {formatNumber(beersBrewed)}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    alignItems: 'center',
    paddingTop: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  prestige: {
    fontSize: 14,
    color: COLORS.accent,
    marginTop: 2,
  },
  beerInfo: {
    alignItems: 'center',
    marginTop: 8,
  },
  beerName: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  tapArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stats: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  statText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
});
