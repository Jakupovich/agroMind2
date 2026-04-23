import { Stack, router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider } from '@/theme';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/theme';
import { initI18n } from '@/i18n';

/**
 * Dev / demo flag — always force onboarding on app start (clears the saved
 * pin + crops + size so the map opens on Montenegro again). Flip to `false`
 * before cutting a production build if you want returning users to skip
 * onboarding.
 */
const FORCE_ONBOARDING = __DEV__;

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    (async () => {
      await initI18n();
      if (FORCE_ONBOARDING) {
        await AsyncStorage.multiRemove([
          'onboarding_complete',
          'farm_location',
          'farm_crops',
          'farm_size',
        ]);
        setNeedsOnboarding(true);
      } else {
        const val = await AsyncStorage.getItem('onboarding_complete');
        setNeedsOnboarding(!val);
      }
      setReady(true);
    })();
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
          <Stack.Screen
            name="frost-detail"
            options={{ presentation: 'modal', headerShown: false }}
          />
        </Stack>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
