/* eslint-disable no-bitwise */

import { useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import { BleManager, Device } from "react-native-ble-plx";
import { decode as atob, encode as btoa } from "base-64";

const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const CHAR_UUID_DATA = "beb5483e-36e1-4688-b7f5-ea07361b26a8";
const CHAR_UUID_COMMAND = "beb5483e-36e1-4688-b7f5-ea07361b26a9";

interface BluetoothApi {
  requestPermission(): Promise<boolean>;
  scanForPeripherals(): void;
  allDevices: Device[];
  connectToDevice: (device: Device) => Promise<void>;
  connectedDevice: Device | null;
  disconnectFromDevice(): void;
  sendCommand: (command: string) => Promise<void>;
}

const bleManager = new BleManager();

export default function useBLE(): BluetoothApi {
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);

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

  const scanForPeripherals = () => {
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error("Scan error:", error);
        return;
      }
      if (device && device.name === "FeedFlow") {
        setAllDevices((prevDevices) => {
          if (!prevDevices.find((d) => d.id === device.id)) {
            return [...prevDevices, device];
          }
          return prevDevices;
        });
      }
    });

    // Stop scanning after 10 seconds
    setTimeout(() => {
      bleManager.stopDeviceScan();
    }, 10000);
  };

  const connectToDevice = async (device: Device) => {
    try {
      const connected = await bleManager.connectToDevice(device.id);
      await connected.discoverAllServicesAndCharacteristics();
      setConnectedDevice(connected);
      bleManager.stopDeviceScan();

      // Start monitoring data
      connected.monitorCharacteristicForService(
        SERVICE_UUID,
        CHAR_UUID_DATA,
        (error, characteristic) => {
          if (error) {
            console.error("Monitor error:", error);
            return;
          }
          if (characteristic?.value) {
            const data = atob(characteristic.value);
            console.log("Received data:", data);
          }
        }
      );
    } catch (error) {
      console.error("Connection error:", error);
    }
  };

  const disconnectFromDevice = async () => {
    if (connectedDevice) {
      await bleManager.cancelDeviceConnection(connectedDevice.id);
      setConnectedDevice(null);
    }
  };

  const sendCommand = async (command: string) => {
    if (!connectedDevice) return;

    try {
      const encoded = btoa(command);
      await connectedDevice.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        CHAR_UUID_COMMAND,
        encoded
      );
    } catch (error) {
      console.error("Send command error:", error);
    }
  };

  return {
    scanForPeripherals,
    requestPermission,
    allDevices,
    connectToDevice,
    connectedDevice,
    disconnectFromDevice,
    sendCommand,
  };
}