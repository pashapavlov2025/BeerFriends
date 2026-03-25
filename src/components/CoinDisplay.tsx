import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { formatNumber, formatRate } from '../utils/formatNumber';
import { getBeerById } from '../data/beers';
import { COLORS } from '../data/constants';

export default function CoinDisplay() {
  const coins = useGameStore((s) => s.coins);
  const autoBrewRate = useGameStore((s) => s.autoBrewRate);
  const currentBeer = useGameStore((s) => s.currentBeer);
  const prestigeMultiplier = useGameStore((s) => s.prestigeMultiplier);

  const beer = getBeerById(currentBeer);
  const effectiveRate = autoBrewRate * beer.autoBonus * prestigeMultiplier;

  return (
    <View style={styles.container}>
      <Text style={styles.coins}>🪙 {formatNumber(coins)}</Text>
      {effectiveRate > 0 && (
        <Text style={styles.rate}>{formatRate(effectiveRate)} auto</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  coins: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.coinGold,
  },
  rate: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
