import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { Colors, FontSize } from '@/constants/theme';

interface Props {
  target: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  style?: object;
  fontSize?: number;
  color?: string;
}

export function AnimatedNumber({ target, duration = 1800, suffix = '', prefix = '', style, fontSize = FontSize.hero, color = Colors.green }: Props) {
  const animValue = useRef(new Animated.Value(0)).current;
  const displayValue = useRef(0);

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: target,
      duration,
      useNativeDriver: false,
    }).start();
  }, [target]);

  return (
    <Animated.Text
      style={[{ fontSize, fontWeight: '800', color, letterSpacing: -1 }, style]}
    >
      {animValue.interpolate({
        inputRange: [0, target],
        outputRange: [`${prefix}0${suffix}`, `${prefix}${target}${suffix}`],
      })}
    </Animated.Text>
  );
}