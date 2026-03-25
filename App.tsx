import React, { useEffect, useRef, useState, Component, ErrorInfo, ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { COLORS } from './src/data/constants';

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

const FullApp = React.lazy(() => import('./src/FullApp'));

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <Text style={styles.loadingEmoji}>🍺</Text>
      <Text style={styles.loadingTitle}>BeerFriends</Text>
      <Text style={styles.loadingSubtitle}>Loading Brewery...</Text>
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
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingEmoji: {
    fontSize: 80,
  },
  loadingTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 16,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
});
