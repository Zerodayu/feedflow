/* eslint-disable no-bitwise */

import { useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import RNBluetoothClassic, { BluetoothDevice } from "react-native-bluetooth-classic";

interface BluetoothApi {
  requestPermission(): Promise<boolean>;
  scanForPeripherals(): Promise<void>;
  allDevices: BluetoothDevice[];
  connectToDevice: (device: BluetoothDevice) => Promise<void>;
  connectedDevice: BluetoothDevice | null;
  disconnectFromDevice(): void;
}

export default function useBLE(): BluetoothApi {
  const [allDevices, setAllDevices] = useState<BluetoothDevice[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null);

  const requestPermission = async () => {
    if (Platform.OS === "android") {
      const permissions = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      
      return Object.values(permissions).every(
        (status) => status === PermissionsAndroid.RESULTS.GRANTED
      );
    }
    return true;
  };

  const scanForPeripherals = async () => {
    try {
      const devices = await RNBluetoothClassic.getBondedDevices();
      // Filter for only your FeedFlow device
      const feedFlowDevices = devices.filter(
        (device) => device.name === "FeedFlow"
      );
      setAllDevices(feedFlowDevices);
    } catch (error) {
      console.error("Discovery error:", error);
    }
  };

  const connectToDevice = async (device: BluetoothDevice) => {
    try {
      const connected = await device.connect();
      setConnectedDevice(connected? device : null);
    } catch (error) {
      console.error("Connection error:", error);
    }
  };

  const disconnectFromDevice = async () => {
    if (connectedDevice) {
      await connectedDevice.disconnect();
      setConnectedDevice(null);
    }
  };

  return {
    scanForPeripherals,
    requestPermission,
    allDevices,
    connectToDevice,
    connectedDevice,
    disconnectFromDevice,
  };
}