import { Stack, router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider } from '@/theme';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/theme';
import { initI18n } from '@/i18n';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    Promise.all([
      initI18n(),
      AsyncStorage.getItem('onboarding_complete'),
    ]).then(([, val]) => {
      setNeedsOnboarding(!val);
      setReady(true);
    });
  }, []);

  // Run the redirect only AFTER the Stack has been rendered — otherwise
  // `router.replace` fires before the navigator is mounted and silently no-ops.
  useEffect(() => {
    if (ready && needsOnboarding) {
      router.replace('/onboarding');
    }
  }, [ready, needsOnboarding]);

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={Colors.green} size="large" />
      </View>
    );
  }

  return (
    <AlertProvider>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
        </Stack>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
