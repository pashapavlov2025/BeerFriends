import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Upgrade } from '../types';
import { useGameStore } from '../store/gameStore';
import { getUpgradeCost } from '../data/upgrades';
import { formatNumber } from '../utils/formatNumber';
import { COLORS } from '../data/constants';

interface Props {
  upgrade: Upgrade;
}

export default function UpgradeCard({ upgrade }: Props) {
  const coins = useGameStore((s) => s.coins);
  const upgrades = useGameStore((s) => s.upgrades);
  const buyUpgrade = useGameStore((s) => s.buyUpgrade);

  const level = upgrades[upgrade.id] ?? 0;
  const cost = getUpgradeCost(upgrade, level);
  const canAfford = coins >= cost;
  const maxed = level >= upgrade.maxLevel;

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.emoji}>{upgrade.emoji}</Text>
        <View style={styles.details}>
          <Text style={styles.name}>
            {upgrade.name} <Text style={styles.level}>Lv.{level}</Text>
          </Text>
          <Text style={styles.description}>{upgrade.description}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={[
          styles.buyButton,
          !canAfford && !maxed && styles.buyButtonDisabled,
          maxed && styles.buyButtonMaxed,
        ]}
        onPress={() => buyUpgrade(upgrade.id)}
        disabled={!canAfford || maxed}
      >
        <Text
          style={[
            styles.buyText,
            !canAfford && !maxed && styles.buyTextDisabled,
          ]}
        >
          {maxed ? 'MAX' : `🪙 ${formatNumber(cost)}`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emoji: {
    fontSize: 32,
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  level: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: 'normal',
  },
  description: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  buyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  buyButtonDisabled: {
    backgroundColor: COLORS.locked,
  },
  buyButtonMaxed: {
    backgroundColor: COLORS.secondary,
  },
  buyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  buyTextDisabled: {
    color: COLORS.textMuted,
  },
});
