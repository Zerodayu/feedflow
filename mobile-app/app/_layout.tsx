import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { mainColors } from "../utils/global-theme";
import { BLEProvider } from '@/contexts/BLEprovider';

export default function RootLayout() {
  return (
    <BLEProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerStyle: { backgroundColor: mainColors.background }, headerTitleStyle: { color: mainColors.foreground } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </BLEProvider>
  );
}
