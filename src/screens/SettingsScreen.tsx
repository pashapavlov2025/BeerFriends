import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import SafeArea from '../components/SafeArea';
import { useGameStore } from '../store/gameStore';
import { formatNumber } from '../utils/formatNumber';
import { COLORS, GAME_CONSTANTS } from '../data/constants';

export default function SettingsScreen() {
  const totalCoins = useGameStore((s) => s.totalCoins);
  const beersBrewed = useGameStore((s) => s.beersBrewed);
  const prestigeLevel = useGameStore((s) => s.prestigeLevel);
  const prestigeMultiplier = useGameStore((s) => s.prestigeMultiplier);
  const prestige = useGameStore((s) => s.prestige);
  const resetGame = useGameStore((s) => s.resetGame);

  const canPrestige = totalCoins >= GAME_CONSTANTS.PRESTIGE_COST;

  const confirmAction = (title: string, message: string, onConfirm: () => void) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${message}`)) {
        onConfirm();
      }
    } else {
      Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', style: 'destructive', onPress: onConfirm },
      ]);
    }
  };

  const handlePrestige = () => {
    confirmAction(
      '⭐ Prestige Reset',
      `Reset all progress for a permanent ${Math.round(GAME_CONSTANTS.PRESTIGE_BONUS * 100)}% earnings multiplier?\n\nYour coins and upgrades will be reset, but you'll earn more forever!`,
      prestige
    );
  };

  const handleReset = () => {
    confirmAction(
      '🗑️ Reset Game',
      'This will delete ALL progress, including prestige levels. Are you sure?',
      resetGame
    );
  };

  return (
    <SafeArea style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚙️ Settings</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Statistics</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Lifetime Coins</Text>
            <Text style={styles.statValue}>🪙 {formatNumber(totalCoins)}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Beers Brewed</Text>
            <Text style={styles.statValue}>🍺 {formatNumber(beersBrewed)}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Prestige Level</Text>
            <Text style={styles.statValue}>⭐ {prestigeLevel}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Earnings Multiplier</Text>
            <Text style={styles.statValue}>{prestigeMultiplier.toFixed(1)}x</Text>
          </View>
        </View>

        {/* Prestige */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⭐ Prestige</Text>
          <Text style={styles.prestigeInfo}>
            Earn {formatNumber(GAME_CONSTANTS.PRESTIGE_COST)} lifetime coins to prestige.
            Each prestige gives +{Math.round(GAME_CONSTANTS.PRESTIGE_BONUS * 100)}% permanent earnings.
          </Text>
          <TouchableOpacity
            style={[styles.prestigeButton, !canPrestige && styles.buttonDisabled]}
            onPress={handlePrestige}
            disabled={!canPrestige}
          >
            <Text style={[styles.buttonText, !canPrestige && styles.buttonTextDisabled]}>
              {canPrestige ? '⭐ Prestige Now!' : `Need ${formatNumber(GAME_CONSTANTS.PRESTIGE_COST)} lifetime coins`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Monetization Stubs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💎 Premium</Text>
          <TouchableOpacity style={styles.shopButton} onPress={() => Platform.OS === 'web' ? window.alert('Coming Soon!\n\nIn-app purchases coming soon!') : Alert.alert('Coming Soon', 'In-app purchases coming soon!')}>
            <Text style={styles.shopButtonText}>🪙 10,000 Coins — $0.99</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shopButton} onPress={() => Platform.OS === 'web' ? window.alert('Coming Soon!\n\nIn-app purchases coming soon!') : Alert.alert('Coming Soon', 'In-app purchases coming soon!')}>
            <Text style={styles.shopButtonText}>🪙 100,000 Coins — $4.99</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shopButton} onPress={() => Platform.OS === 'web' ? window.alert('Coming Soon!\n\nIn-app purchases coming soon!') : Alert.alert('Coming Soon', 'In-app purchases coming soon!')}>
            <Text style={styles.shopButtonText}>🚫 Remove Ads — $2.99</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.adButton} onPress={() => Platform.OS === 'web' ? window.alert('Coming Soon!\n\nRewarded ads coming soon!') : Alert.alert('Coming Soon', 'Rewarded ads coming soon!')}>
            <Text style={styles.adButtonText}>🎬 Watch Ad for 2x Earnings (30min)</Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Danger Zone</Text>
          <TouchableOpacity style={styles.dangerButton} onPress={handleReset}>
            <Text style={styles.dangerText}>🗑️ Reset All Progress</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>BeerFriends v1.0.0 MVP</Text>
      </ScrollView>
    </SafeArea>
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
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 16,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  prestigeInfo: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  prestigeButton: {
    backgroundColor: COLORS.accent,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: COLORS.locked,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  buttonTextDisabled: {
    color: COLORS.textMuted,
  },
  shopButton: {
    backgroundColor: COLORS.surfaceLight,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  shopButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  adButton: {
    backgroundColor: COLORS.success,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  adButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  dangerButton: {
    backgroundColor: COLORS.danger,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  dangerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  version: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 8,
    marginBottom: 32,
  },
});
