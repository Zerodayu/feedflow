import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { mainColors } from "../utils/global-theme";
import { BLEProvider } from '@/contexts/BLEprovider';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useNavigation,
  NavigationContainer,
} from '@react-navigation/native';

export default function RootLayout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: mainColors.background }}>
      <BLEProvider>

        <StatusBar style="dark" translucent />
        <Stack screenOptions={{
          headerStyle: { backgroundColor: mainColors.background },
          headerTitleStyle: { color: mainColors.foreground }
        }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </BLEProvider>
    </SafeAreaView>
  );
}
