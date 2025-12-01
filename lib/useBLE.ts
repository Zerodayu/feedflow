/* eslint-disable no-bitwise */

import * as ExpoDevice from "expo-device";
import { useRef, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import { BleManager, Device } from "react-native-ble-plx";

interface BluetoothLowEnergyApi {
  requestPermission(): Promise<boolean>;
  scanForPeripherals(): void;
  allDevices: Device[];
}

export default function useBLE(): BluetoothLowEnergyApi {
  const bleManagerRef = useRef<BleManager | null>(null);
  const [allDevices, setAllDevices] = useState<Device[]>([]);

  const getBleManager = () => {
    if (!bleManagerRef.current) {
      bleManagerRef.current = new BleManager();
    }
    return bleManagerRef.current;
  };

  const requestAndroidPermission = async () => {
    const bluetoothScanPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      {
        title: "Bluetooth Scan Permission",
        message: "This app needs access to Bluetooth scanning to discover nearby devices.",
        buttonPositive: "OK",
      }
    );
    const bluetoothConnectPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      {
        title: "Bluetooth Connect Permission",
        message: "This app needs access to Bluetooth connection to connect to nearby devices.",
        buttonPositive: "OK",
      }
    );
    const bluetoothFineLocationPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "Fine Location Permission",
        message: "This app needs access to fine location to discover nearby devices.",
        buttonPositive: "OK",
      }
    );

    return (
      bluetoothScanPermission === PermissionsAndroid.RESULTS.GRANTED &&
      bluetoothConnectPermission === PermissionsAndroid.RESULTS.GRANTED &&
      bluetoothFineLocationPermission === PermissionsAndroid.RESULTS.GRANTED
    );
  };

  const requestPermission = async () => {
    if (Platform.OS === "android") {
      if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "Bluetooth Low Energy requires Location",
            buttonPositive: "OK",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const isAndroid31PermissionsGranted = await requestAndroidPermission();
        return isAndroid31PermissionsGranted;
      }
    } else {
      return true;
    }
  };

  const isDuplicateDevice = (devices: Device[], nextDevice: Device) => {
    return devices.findIndex((device) => device.id === nextDevice.id) > -1;
  }

  const scanForPeripherals = () =>
    getBleManager().startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log(error);
      }
      if (device) {
        setAllDevices((prevState: Device[]) => {
          if (!isDuplicateDevice(prevState, device)) {
            return [...prevState, device];
          }
          return prevState;
        });
      }
    });

  return {
    scanForPeripherals,
    requestPermission,
    allDevices,
  }
}