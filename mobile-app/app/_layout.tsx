import { Stack, Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { mainColors } from "../utils/global-theme";
import { BLEProvider } from '@/contexts/BLEprovider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DatabaseProvider } from '@/contexts/DBprovider';

export default function RootLayout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: mainColors.background }}>
      <DatabaseProvider>
        <BLEProvider>
          <StatusBar style="dark" translucent />
          <Slot />
        </BLEProvider>
      </DatabaseProvider>
    </SafeAreaView>
  );
}
