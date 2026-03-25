import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import SafeArea from '../components/SafeArea';
import UpgradeCard from '../components/UpgradeCard';
import CoinDisplay from '../components/CoinDisplay';
import { UPGRADES } from '../data/upgrades';
import { COLORS } from '../data/constants';

export default function UpgradesScreen() {
  return (
    <SafeArea style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⬆️ Upgrades</Text>
      </View>
      <CoinDisplay />
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {UPGRADES.map((upgrade) => (
          <UpgradeCard key={upgrade.id} upgrade={upgrade} />
        ))}
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
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
});
