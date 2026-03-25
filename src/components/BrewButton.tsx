import React, { useRef, useCallback } from 'react';
import {
  Animated,
  TouchableWithoutFeedback,
  StyleSheet,
  View,
  Text,
  GestureResponderEvent,
} from 'react-native';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useGameStore } from '../store/gameStore';
import { getBeerById } from '../data/beers';
import { formatNumber } from '../utils/formatNumber';
import { COLORS } from '../data/constants';

interface Props {
  onTapAt: (x: number, y: number, value: number) => void;
}

export default function BrewButton({ onTapAt }: Props) {
  const tap = useGameStore((s) => s.tap);
  const tapPower = useGameStore((s) => s.tapPower);
  const currentBeer = useGameStore((s) => s.currentBeer);
  const prestigeMultiplier = useGameStore((s) => s.prestigeMultiplier);
  const scale = useRef(new Animated.Value(1)).current;

  const beer = getBeerById(currentBeer);
  const effectiveTap = tapPower * beer.tapBonus * prestigeMultiplier;

  const handleTap = useCallback(
    (e: GestureResponderEvent) => {
      const { locationX, locationY } = e.nativeEvent;
      tap();
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onTapAt(locationX, locationY, effectiveTap);

      Animated.sequence([
        Animated.timing(scale, {
          toValue: 0.9,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [tap, effectiveTap, onTapAt]
  );

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <Animated.View style={[styles.button, { transform: [{ scale }] }]}>
        <Text style={styles.emoji}>{beer.emoji}</Text>
        <Text style={styles.label}>TAP TO BREW</Text>
        <Text style={styles.power}>+{formatNumber(effectiveTap)}/tap</Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 4,
    borderColor: COLORS.primaryDark,
  },
  emoji: {
    fontSize: 60,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.background,
    marginTop: 4,
  },
  power: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.surface,
  },
});
