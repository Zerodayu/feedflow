import { StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native'
import { Link } from 'expo-router';
import { useBLEContext } from '@/contexts/BLEprovider';
import { mainColors } from '@/utils/global-theme';
import { useState } from 'react';
import DeviceModal from '@/components/DeviceConnectionModal';
import { Cable, LockKeyhole } from 'lucide-react-native'

export default function Setup() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const {
    requestPermission,
    scanForPeripherals,
    allDevices,
    connectToDevice,
    connectedDevice,
    disconnectFromDevice,
  } = useBLEContext();

  const hideModal = () => {
    setIsModalVisible(false);
  };

  const openModal = async () => {
    scanForDevices();
    setIsModalVisible(true);
  };

  const scanForDevices = async () => {
    const isPermissionEnabled = await requestPermission();

    if (isPermissionEnabled) {
      scanForPeripherals();
    }
  };

  return (
    <View style={styles.base}>
      <LockKeyhole color={mainColors.primary} size={64} />
      <Text style={styles.title}>Connect your device to get started</Text>
      <Text style={styles.text}>Lets setup your FeedFlow IoT device to start monirtoring and controlling your system</Text>
      <TouchableOpacity onPress={connectedDevice ? disconnectFromDevice : openModal} style={styles.ctaButton}>
        <Cable color={mainColors.background} />
        <Text style={styles.ctaButtonText}>{connectedDevice ? "Disconnect" : "Setup Device"}</Text>
      </TouchableOpacity>
      <DeviceModal
        devices={allDevices}
        visible={isModalVisible}
        connectToPeripheral={connectToDevice}
        closeModal={hideModal}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 20,
    backgroundColor: mainColors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: mainColors.foreground,
  },
  text: {
    fontSize: 14,
    textAlign: 'center',
    color: mainColors.foreground,
  },
  ctaButton: {
    flexDirection: "row",
    backgroundColor: mainColors.primary,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    gap: 10,
    width: "100%",
    borderRadius: mainColors.radius,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: mainColors.background,
  },
})