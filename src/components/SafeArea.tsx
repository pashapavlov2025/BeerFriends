import React from 'react';
import { View, SafeAreaView, Platform, ViewStyle, StyleProp } from 'react-native';

interface Props {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export default function SafeArea({ style, children }: Props) {
  if (Platform.OS === 'web') {
    return <View style={[{ flex: 1 }, style]}>{children}</View>;
  }
  return <SafeAreaView style={style}>{children}</SafeAreaView>;
}
