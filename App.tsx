import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🍺</Text>
      <Text style={styles.title}>BeerFriends</Text>
      <Text style={styles.subtitle}>Brewery Tycoon</Text>
      <Text style={styles.info}>If you see this, the app works!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0f00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#d4a574',
    marginTop: 4,
  },
  info: {
    fontSize: 14,
    color: '#92716a',
    marginTop: 24,
  },
});
