import DeviceModal from '@/components/DeviceConnectionModal';
import { useBLEContext } from '@/contexts/BLEprovider';
import { buttonS } from '@/styles/buttons';
import { mainColors } from '@/utils/global-theme';
import { Link } from 'expo-router';
import { useState } from 'react';
import { useSendFeedLogs } from '@/actions/send-feedlogs';
import { StyleSheet, Text, TouchableOpacity, View, Button } from 'react-native';

export default function Index() {
  const { handleSendLogs } = useSendFeedLogs();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const {
    requestPermission,
    scanForPeripherals,
    allDevices,
    connectToDevice,
    connectedDevice,
    disconnectFromDevice,
    weight,
    temperature
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
      <Link href="/(tabs)" style={buttonS.outline}>Go to Some Path</Link>
      <Text style={styles.link}>{connectedDevice ? `Connected to: ${connectedDevice.name ?? connectedDevice.id}` : "Not connected"}</Text>
      <Text style={styles.ctaButtonText}>Weight: {weight} kg</Text>
      <Text style={styles.ctaButtonText}>Temperature: {temperature} °C</Text>
      <TouchableOpacity onPress={connectedDevice ? disconnectFromDevice : openModal} style={buttonS.primary}>
        <Text style={styles.ctaButtonText}>{connectedDevice ? "Disconnect" : "Connect"}</Text>
      </TouchableOpacity>
      <Button title="Send Feed Logs" onPress={handleSendLogs} />
      <DeviceModal
        devices={allDevices}
        visible={isModalVisible}
        connectToPeripheral={connectToDevice}
        closeModal={hideModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: mainColors.background,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
    color: mainColors.accent,
  },
  ctaButton: {
    backgroundColor: mainColors.primary,
    justifyContent: "center",
    alignItems: "center",
    height: 50,
    marginHorizontal: 20,
    marginBottom: 5,
    borderRadius: 8,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: mainColors.foreground,
  },
});