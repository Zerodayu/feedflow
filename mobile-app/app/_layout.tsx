import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { mainColors } from "../utils/global-theme";
import { BLEProvider } from '@/contexts/BLEprovider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SQLiteDatabase, SQLiteProvider } from "expo-sqlite"
import { initializeDatabase } from "@/database/init-db";

export default function RootLayout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: mainColors.background }}>
      <SQLiteProvider
        databaseName="feedflow"
        options={{
          libSQLOptions: {
            url: process.env.EXPO_PUBLIC_TURSO_DB_URL!,
            authToken: process.env.EXPO_PUBLIC_TURSO_DB_AUTH_TOKEN!
          }
        }}
        onInit={initializeDatabase}
      >
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
      </SQLiteProvider>
    </SafeAreaView>
  );
}
