/* eslint-disable no-bitwise */

import { useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import { BleError, BleManager, Characteristic, Device } from "react-native-ble-plx";
import { decode, encode } from "base-64";

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
  weight: number;
}

const bleManager = new BleManager();

export default function useBLE(): BluetoothApi {
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [weight, setWeight] = useState<number>(0);

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
      startStreamingData(connected);

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
            const data = decode(characteristic.value);
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
      const encoded = encode(command);
      await connectedDevice.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        CHAR_UUID_COMMAND,
        encoded
      );
    } catch (error) {
      console.error("Send command error:", error);
    }
  };

  const onDataUpdate = (
    error: BleError | null,
    characteristic: Characteristic | null
  ) => {
    if (error) {
      console.log(error);
      return;
    }
    if (!characteristic?.value) {
      console.log("No Data was received");
      return;
    }

    const rawData = decode(characteristic.value);
    console.log("Received data:", rawData);

    // Parse the second value from comma-separated data
    const values = rawData.split(",");
    if (values.length >= 2) {
      const weightValue = parseFloat(values[1]);
      setWeight(weightValue);
    }
  };

  const startStreamingData = async (device: Device) => {
    if (device) {
      device.monitorCharacteristicForService(
        SERVICE_UUID,
        CHAR_UUID_DATA,
        onDataUpdate
      );
    } else {
      console.error("Device not connected");
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
    weight,
  };
}