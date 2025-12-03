import { mainColors } from "@/utils/global-theme";
import React, { FC, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSendAveWeight } from "@/actions/send-abw";
import { useSendFishCount } from "@/actions/send-fishcount";
import Feather from '@expo/vector-icons/Feather';

type SetBiomassModalProps = {
  visible: boolean;
  closeModal: () => void;
};

const SetBiomassModal: FC<SetBiomassModalProps> = (props) => {
  const { visible, closeModal } = props;
  const { handleSendAveWeight } = useSendAveWeight();
  const { handleSendFishCount } = useSendFishCount();
  const [weight, setWeight] = useState("");
  const [fishCount, setFishCount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const weightValue = parseFloat(weight);
    const fishCountValue = parseInt(fishCount, 10);
    
    if (isNaN(weightValue) || weightValue <= 0) {
      alert("Please enter a valid weight");
      return;
    }

    if (isNaN(fishCountValue) || fishCountValue <= 0) {
      alert("Please enter a valid fish count");
      return;
    }

    setIsSubmitting(true);
    try {
      const weightResult = await handleSendAveWeight(weightValue);
      const fishCountResult = await handleSendFishCount(fishCountValue);
      
      if (weightResult.success && fishCountResult.success) {
        setWeight("");
        setFishCount("");
        closeModal();
      } else {
        alert("Failed to save data");
      }
    } catch (error) {
      console.error("Error saving data:", error);
      alert("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setWeight("");
    setFishCount("");
    closeModal();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={modalStyle.modalOverlay}>
        <SafeAreaView style={modalStyle.modalContainer}>
          <View style={modalStyle.modalContent}>
            <Text style={modalStyle.modalTitle}>Set Biomass Data</Text>
            
            <View style={modalStyle.inputContainer}>
              <Text style={modalStyle.label}>Average Weight (kg)</Text>
              <TextInput
                style={modalStyle.input}
                placeholder="Enter weight"
                placeholderTextColor={mainColors.foreground+50}
                keyboardType="decimal-pad"
                value={weight}
                onChangeText={setWeight}
                editable={!isSubmitting}
              />
            </View>

            <View style={modalStyle.inputContainer}>
              <Text style={modalStyle.label}>Total Fish Count</Text>
              <TextInput
                style={modalStyle.input}
                placeholder="Enter fish count"
                placeholderTextColor={mainColors.foreground+50}
                keyboardType="number-pad"
                value={fishCount}
                onChangeText={setFishCount}
                editable={!isSubmitting}
              />
            </View>

            <View style={modalStyle.buttonContainer}>
              <TouchableOpacity
                style={[modalStyle.button, modalStyle.cancelButton]}
                onPress={handleClose}
                disabled={isSubmitting}
              >
                <Feather name="x" size={20} color={mainColors.foreground} />
                <Text style={modalStyle.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  modalStyle.button,
                  modalStyle.submitButton,
                  isSubmitting && modalStyle.disabledButton
                ]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <Feather name="check" size={20} color={mainColors.foreground} />
                <Text style={modalStyle.submitButtonText}>
                  {isSubmitting ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const modalStyle = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: mainColors.accent + "70",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: mainColors.background,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: mainColors.accent,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: mainColors.foreground,
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: mainColors.foreground,
    marginBottom: 8,
  },
  input: {
    backgroundColor: mainColors.background,
    borderWidth: 1,
    borderColor: mainColors.accent,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: mainColors.foreground,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: mainColors.secondary,
    borderWidth: 1,
    borderColor: mainColors.accent,
  },
  submitButton: {
    backgroundColor: mainColors.primary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: mainColors.foreground,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: mainColors.foreground,
  },
});

export default SetBiomassModal;