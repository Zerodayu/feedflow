import { mainColors } from "@/utils/global-theme";
import React, { FC, useCallback } from "react";
import {
  FlatList,
  ListRenderItemInfo,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Device } from "react-native-ble-plx";
import { useRouter } from "expo-router";
import { BluetoothSearching } from 'lucide-react-native';

type DeviceModalListItemProps = {
  item: ListRenderItemInfo<Device>;
  connectToPeripheral: (device: Device) => void;
  closeModal: () => void;
};

type DeviceModalProps = {
  devices: Device[];
  visible: boolean;
  connectToPeripheral: (device: Device) => void;
  closeModal: () => void;
};

const DeviceModalListItem: FC<DeviceModalListItemProps> = (props) => {
  const { item, connectToPeripheral, closeModal } = props;
  const router = useRouter();

  const connectAndCloseModal = useCallback(async () => {
    await connectToPeripheral(item.item);
    closeModal();
    router.replace('/(tabs)');
  }, [closeModal, connectToPeripheral, item.item, router]);

  return (
    <TouchableOpacity
      onPress={connectAndCloseModal}
      style={modalStyle.ctaButton}
    >
      <Text style={modalStyle.ctaButtonText}>{item.item.name}</Text>
    </TouchableOpacity>
  );
};

const DeviceModal: FC<DeviceModalProps> = (props) => {
  const { devices, visible, connectToPeripheral, closeModal } = props;

  const renderDeviceModalListItem = useCallback(
    (item: ListRenderItemInfo<Device>) => {
      return (
        <DeviceModalListItem
          item={item}
          connectToPeripheral={connectToPeripheral}
          closeModal={closeModal}
        />
      );
    },
    [closeModal, connectToPeripheral]
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      allowSwipeDismissal
      onRequestClose={closeModal}
    >
      <View style={modalStyle.base}>
        <View style={modalStyle.box}>
          <Text style={modalStyle.title}>
            Connect to Device
          </Text>
          <View style={modalStyle.iconBox}>
            <BluetoothSearching size={34} color={mainColors.background} />
          </View>
          <Text style={modalStyle.text}>Make sure your FeedFlow device is powered on and within range.</Text>
          <Text style={modalStyle.text}>We're searching for available devices...</Text>
          <Text style={modalStyle.label}>Select and click on your device to connect.</Text>
          <FlatList
            contentContainerStyle={modalStyle.modalFlatlistContainer}
            data={devices}
            renderItem={renderDeviceModalListItem}
          />
        </View>
      </View>
    </Modal>
  );
};

const modalStyle = StyleSheet.create({
  base: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  modalFlatlistContainer: {
    justifyContent: "center",
    flexGrow: 1,
  },
  box: {
    backgroundColor: mainColors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 20,
    height: '50%',
    width: '85%',
    shadowColor: mainColors.foreground,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 5,
    borderRadius: 12,
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
  label: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: 'center',
    color: mainColors.foreground,
  },
  ctaButton: {
    backgroundColor: mainColors.primary,
    justifyContent: "center",
    alignItems: "center",
    height: 50,
    marginHorizontal: 20,
    marginBottom: 5,
    borderRadius: 100,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: mainColors.foreground,
  },
  iconBox: {
    padding: 10,
    backgroundColor: mainColors.primary,
    borderRadius: 100,
    alignContent: "center",
    justifyContent: "center",
  }
});

export default DeviceModal;