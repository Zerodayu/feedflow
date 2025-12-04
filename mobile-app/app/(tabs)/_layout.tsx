import { mainColors } from "@/utils/global-theme";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useBLEContext } from "@/contexts/BLEprovider";
import {
  ChartPie,
  Home,
  Bolt,
  NotebookPen,
  TriangleAlert
} from "lucide-react-native";
import { useState } from "react";
import DeviceModal from "@/components/DeviceConnectionModal";


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
            backgroundColor: mainColors.accent,
            borderTopColor: mainColors.primary,
            paddingTop: 5,
          },
          tabBarActiveTintColor: mainColors.primary,
          tabBarInactiveTintColor: mainColors.foreground + 50,
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
          name="(stats)"
          options={{
            title: "Stats",
            tabBarIcon: ({ color, size }) => <ChartPie color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="notes"
          options={{
            title: "Notes",
            tabBarIcon: ({ color, size }) => <NotebookPen color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="alerts"
          options={{
            title: "Alerts",
            tabBarIcon: ({ color, size }) => <TriangleAlert color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="about"
          options={{
            title: "About",
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Bolt color={color} size={size} />,
          }}
        />
      </Tabs>
    </>
  );
}

function Header() {
  const { connectedDevice, disconnectFromDevice, allDevices, connectToDevice, scanForPeripherals } = useBLEContext();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleButtonPress = () => {
    if (connectedDevice) {
      disconnectFromDevice();
    } else {
      scanForPeripherals();
      setIsModalVisible(true);
    }
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  return (
    <>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>FeedFlow</Text>
          <Text
            style={connectedDevice ? styles.connectedText : styles.disconnectedText}
          >
            {connectedDevice ? `Connected: ${connectedDevice.name}` : "Disconnected"}
          </Text>
        </View>
        <View>
          <TouchableOpacity onPress={handleButtonPress} style={styles.button}>
            <Text style={styles.buttonText}>
              {connectedDevice ? "Disconnect" : "Connect"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <DeviceModal
        devices={allDevices}
        visible={isModalVisible}
        connectToPeripheral={connectToDevice}
        closeModal={closeModal}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
    backgroundColor: mainColors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minWidth: "100%",
    backgroundColor: mainColors.primary,
    padding: 10,
    marginBottom: 10,
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
  button: {
    backgroundColor: mainColors.accent,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: mainColors.md,
  },
  buttonText: {
    color: mainColors.foreground,
    fontWeight: "bold",
  },
})