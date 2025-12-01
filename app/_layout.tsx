import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { mainColors } from "../utils/global-colors";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: mainColors.background }, headerTitleStyle: { color: mainColors.foreground } }}>
      <StatusBar style="auto" />
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
