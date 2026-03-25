import React, { useEffect, useRef, useState, Component, ErrorInfo, ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { COLORS } from './src/data/constants';

// Error boundary to display crashes visually
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('App crash:', error, info); }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: '#1a0f00', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: '#ef4444', fontSize: 20, fontWeight: 'bold' }}>Error</Text>
          <Text style={{ color: '#fef3c7', fontSize: 14, marginTop: 10 }}>{this.state.error.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// Lazy load the full app to isolate navigation/store errors
const FullApp = React.lazy(() => import('./src/FullApp'));

function LoadingScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>🍺 BeerFriends</Text>
      <Text style={styles.subtitle}>Loading Brewery...</Text>
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <View style={styles.root}>
        <StatusBar style="light" />
        <React.Suspense fallback={<LoadingScreen />}>
          <FullApp />
        </React.Suspense>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 100,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 10,
  },
});
