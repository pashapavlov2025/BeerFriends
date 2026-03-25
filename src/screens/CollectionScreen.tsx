import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import BeerCard from '../components/BeerCard';
import CoinDisplay from '../components/CoinDisplay';
import { BEERS } from '../data/beers';
import { COLORS } from '../data/constants';

export default function CollectionScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📖 Beer Collection</Text>
      </View>
      <CoinDisplay />
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        <View style={styles.grid}>
          {BEERS.map((beer) => (
            <BeerCard key={beer.id} beer={beer} />
          ))}
        </View>
      </ScrollView>
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
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
