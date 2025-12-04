import DeviceModal from '@/components/DeviceConnectionModal';
import { useBLEContext } from '@/contexts/BLEprovider';
import { buttonS } from '@/styles/buttons';
import { mainColors } from '@/utils/global-theme';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { Link } from 'expo-router';
import { Power } from 'lucide-react-native'

export default function Index() {
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
      <View style={styles.boxUp}>
        <Text style={styles.title}>Get Started</Text>
        <Image
          source={require('@/assets/images/feedflow_logo.png')}
          style={{ width: 300, height: 300, marginTop: 20 }}
          resizeMode="contain"
        />
      </View>
      <View style={styles.boxDown}>
        <Link href="/(tabs)" style={buttonS.ghost}>ENTER</Link>
        <TouchableOpacity onPress={connectedDevice ? disconnectFromDevice : openModal} style={styles.ctaButton}>
          <Power color={mainColors.foreground} />
          <Text style={styles.ctaButtonText}>{connectedDevice ? "Disconnect" : "Connect"}</Text>
        </TouchableOpacity>
        <DeviceModal
          devices={allDevices}
          visible={isModalVisible}
          connectToPeripheral={connectToDevice}
          closeModal={hideModal}
        />
      </View>
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
  boxUp: {
    flex: 1,
    width: "100%",
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxDown: {
    flex: 1,
    width: "100%",
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: mainColors.primary,
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
    color: mainColors.foreground,
  },
});