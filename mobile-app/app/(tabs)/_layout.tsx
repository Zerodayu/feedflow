import { mainColors } from "@/utils/global-theme";
import Octicons from '@expo/vector-icons/Octicons';
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaView style={styles.safeAreaView}>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: mainColors.background,
            borderTopColor: mainColors.accent,
          },
          tabBarActiveTintColor: mainColors.primary,
          tabBarInactiveTintColor: mainColors.secondary,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => <Octicons name="home" size={size} color={color} />,
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
    backgroundColor: mainColors.background,
  }
})