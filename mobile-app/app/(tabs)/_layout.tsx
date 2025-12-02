import { mainColors } from "@/utils/global-theme";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { useBLEContext } from "@/contexts/BLEprovider";
import {
  ChartPie,
  Home,
} from "lucide-react-native";


export default function RootLayout() {

  return (
    <>
      <StatusBar style="dark" translucent />
      <Tabs
        screenOptions={{
          headerStatusBarHeight: 0,
          headerShadowVisible: false,
          headerTitle: () => <Header />,
          headerStyle: {
            backgroundColor: mainColors.background,
          },
          tabBarStyle: {
            backgroundColor: mainColors.background,
            borderTopColor: mainColors.accent,
            paddingTop: 5,
          },
          tabBarActiveTintColor: mainColors.primary,
          tabBarInactiveTintColor: mainColors.accent,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: "Stats",
            tabBarIcon: ({ color, size }) => <ChartPie color={color} size={size} />,
          }}
        />
      </Tabs>
    </>
  );
}

function Header() {
  const { connectedDevice } = useBLEContext();

  return (
    <View style={styles.header}>
      <Text style={styles.title}>FeedFlow</Text>
      <Text
        style={connectedDevice ? styles.connectedText : styles.disconnectedText}
      >
        {connectedDevice ? `Connected: ${connectedDevice.name}` : "Disconnected"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
    backgroundColor: mainColors.background,
  },
  header: {
    minWidth: "100%",
    backgroundColor: mainColors.primary,
    padding: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: mainColors.foreground,
  },
  disconnectedText: {
    color: mainColors.destructive,
  },
  connectedText: {
    color: mainColors.primaryForeground,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
})