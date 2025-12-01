import DeviceModal from '@/components/DeviceConnectionModal';
import useBLE from '@/lib/useBLE';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Index() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const {
    requestPermission,
    scanForPeripherals,
    allDevices,
  } = useBLE();

  console.log('allDevices:', allDevices);

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
      <TouchableOpacity onPress={openModal} style={styles.ctaButton}>
        <Text style={styles.ctaButtonText}>Connect</Text>
      </TouchableOpacity>
      <DeviceModal
        devices={allDevices}
        visible={isModalVisible}
        connectToPeripheral={() => {}}
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
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  ctaButton: {
    backgroundColor: "#FF6060",
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
    color: "white",
  },
});