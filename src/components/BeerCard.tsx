import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BeerType } from '../types';
import { useGameStore } from '../store/gameStore';
import { formatNumber } from '../utils/formatNumber';
import { COLORS } from '../data/constants';

interface Props {
  beer: BeerType;
}

export default function BeerCard({ beer }: Props) {
  const coins = useGameStore((s) => s.coins);
  const unlockedBeers = useGameStore((s) => s.unlockedBeers);
  const currentBeer = useGameStore((s) => s.currentBeer);
  const unlockBeer = useGameStore((s) => s.unlockBeer);
  const selectBeer = useGameStore((s) => s.selectBeer);

  const isUnlocked = unlockedBeers.includes(beer.id);
  const isSelected = currentBeer === beer.id;
  const canAfford = coins >= beer.unlockCost;

  return (
    <View style={[styles.card, isSelected && styles.cardSelected]}>
      <Text style={[styles.emoji, !isUnlocked && styles.locked]}>
        {isUnlocked ? beer.emoji : '🔒'}
      </Text>
      <Text style={[styles.name, !isUnlocked && styles.lockedText]}>
        {beer.name}
      </Text>
      {isUnlocked && (
        <>
          <Text style={styles.bonus}>
            Tap: {beer.tapBonus}x | Auto: {beer.autoBonus}x
          </Text>
          {isSelected ? (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedText}>ACTIVE</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => selectBeer(beer.id)}
            >
              <Text style={styles.selectText}>Select</Text>
            </TouchableOpacity>
          )}
        </>
      )}
      {!isUnlocked && (
        <TouchableOpacity
          style={[styles.unlockButton, !canAfford && styles.unlockDisabled]}
          onPress={() => unlockBeer(beer.id)}
          disabled={!canAfford}
        >
          <Text
            style={[
              styles.unlockText,
              !canAfford && styles.unlockTextDisabled,
            ]}
          >
            🪙 {formatNumber(beer.unlockCost)}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.surfaceLight,
  },
  cardSelected: {
    borderColor: COLORS.primary,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 6,
  },
  locked: {
    opacity: 0.5,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  lockedText: {
    color: COLORS.textMuted,
  },
  bonus: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  selectedBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  selectedText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  selectButton: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  selectText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  unlockButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 4,
  },
  unlockDisabled: {
    backgroundColor: COLORS.locked,
  },
  unlockText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  unlockTextDisabled: {
    color: COLORS.textMuted,
  },
});
