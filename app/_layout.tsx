import { Stack, router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider } from '@/theme';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/theme';

function AppGate() {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('onboarding_complete').then((val) => {
      setChecked(true);
      if (!val) {
        router.replace('/onboarding');
      }
    });
  }, []);

  if (!checked) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.green} size="large" />
      </View>
    );
  }

  return null;
}

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
        </Stack>
        <AppGate />
      </SafeAreaProvider>
    </AlertProvider>
  );
}