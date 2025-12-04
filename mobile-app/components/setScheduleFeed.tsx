import { mainColors } from "@/utils/global-theme";
import React, { FC, useState, useEffect } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useScheduleFeeds } from "@/contexts/DBprovider";
import Feather from '@expo/vector-icons/Feather';

type SetScheduleFeedProps = {
  visible: boolean;
  closeModal: () => void;
  editingSchedule?: { id: number; kg: number; time: string } | null;
};

const SetScheduleFeed: FC<SetScheduleFeedProps> = (props) => {
  const { visible, closeModal, editingSchedule } = props;
  const { createScheduleFeed, updateScheduleFeed } = useScheduleFeeds();
  const [kg, setKg] = useState("");
  const [hour, setHour] = useState("12");
  const [minute, setMinute] = useState("00");
  const [isPM, setIsPM] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper function to get current time
  const getCurrentTime = () => {
    const now = new Date();
    const currentHour24 = now.getHours();
    const currentMinute = now.getMinutes();
    const isPMTime = currentHour24 >= 12;
    const hour12 = currentHour24 % 12 || 12;
    
    return {
      hour: hour12.toString(),
      minute: currentMinute.toString().padStart(2, '0'),
      isPM: isPMTime,
    };
  };

  // Load existing schedule data when editing
  useEffect(() => {
    if (editingSchedule) {
      setKg(editingSchedule.kg.toString());
      
      // Parse time (24-hour format) to 12-hour format
      const [hours, minutes] = editingSchedule.time.split(':').map(Number);
      const isPMTime = hours >= 12;
      const hour12 = hours % 12 || 12;
      
      setHour(hour12.toString());
      setMinute(minutes.toString().padStart(2, '0'));
      setIsPM(isPMTime);
    } else {
      // Set to current time when creating new
      const currentTime = getCurrentTime();
      setKg("");
      setHour(currentTime.hour);
      setMinute(currentTime.minute);
      setIsPM(currentTime.isPM);
    }
  }, [editingSchedule, visible]);

  // Helper function to check if selected time is in the past
  const isTimeInPast = (hour24: number, minuteNum: number): boolean => {
    const now = new Date();
    const currentHour24 = now.getHours();
    const currentMinute = now.getMinutes();
    
    if (hour24 < currentHour24) {
      return true;
    }
    if (hour24 === currentHour24 && minuteNum < currentMinute) {
      return true;
    }
    return false;
  };

  const handleSubmit = async () => {
    const kgValue = parseFloat(kg);
    
    if (isNaN(kgValue) || kgValue <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid feed amount");
      return;
    }

    const hourNum = parseInt(hour);
    const minuteNum = parseInt(minute);

    if (hourNum < 1 || hourNum > 12 || minuteNum < 0 || minuteNum > 59) {
      Alert.alert("Invalid Time", "Please enter a valid time");
      return;
    }

    // Convert to 24-hour format
    let hour24 = hourNum;
    if (isPM && hourNum !== 12) {
      hour24 += 12;
    } else if (!isPM && hourNum === 12) {
      hour24 = 0;
    }

    // Check if time is in the past (only for new schedules)
    if (!editingSchedule && isTimeInPast(hour24, minuteNum)) {
      Alert.alert("Invalid Time", "Cannot schedule feed for a time that has already passed. Please select a future time.");
      return;
    }

    setIsSubmitting(true);
    try {
      const timeString = `${hour24.toString().padStart(2, '0')}:${minute.padStart(2, '0')}`;
      
      if (editingSchedule) {
        // Update existing schedule
        await updateScheduleFeed(editingSchedule.id, {
          kg: kgValue,
          time: timeString,
        });
        console.log("Schedule updated successfully");
      } else {
        // Create new schedule
        const result = await createScheduleFeed({
          kg: kgValue,
          time: timeString,
        });
        
        if (result) {
          console.log("Schedule feed set successfully");
        } else {
          console.log("Failed to save schedule");
        }
      }
      
      handleClose();
    } catch (error) {
      console.error("Error saving schedule:", error);
      Alert.alert("Error", "An error occurred while saving the schedule");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setKg("");
    const currentTime = getCurrentTime();
    setHour(currentTime.hour);
    setMinute(currentTime.minute);
    setIsPM(currentTime.isPM);
    closeModal();
  };

  const formatTimeDisplay = () => {
    return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;
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
            <Text style={modalStyle.modalTitle}>
              {editingSchedule ? 'Edit Schedule Feed' : 'Set Schedule Feed'}
            </Text>
            
            <View style={modalStyle.inputContainer}>
              <Text style={modalStyle.label}>Feed Amount (kg)</Text>
              <TextInput
                style={modalStyle.input}
                placeholder="Enter feed amount"
                placeholderTextColor={mainColors.foreground + "50"}
                keyboardType="decimal-pad"
                value={kg}
                onChangeText={setKg}
                editable={!isSubmitting}
              />
            </View>

            <View style={modalStyle.inputContainer}>
              <Text style={modalStyle.label}>Time</Text>
              <View style={modalStyle.timeDisplayContainer}>
                <Feather name="clock" size={20} color={mainColors.foreground} />
                <Text style={modalStyle.timeDisplayText}>{formatTimeDisplay()}</Text>
              </View>
              
              <View style={modalStyle.timeInputContainer}>
                <TextInput
                  style={[modalStyle.input, modalStyle.timeInput]}
                  placeholder="HH"
                  placeholderTextColor={mainColors.foreground + "50"}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={hour}
                  onChangeText={(text) => {
                    const num = parseInt(text) || 0;
                    if (num >= 0 && num <= 12) {
                      setHour(text);
                    }
                  }}
                  editable={!isSubmitting}
                />
                <Text style={modalStyle.timeSeparator}>:</Text>
                <TextInput
                  style={[modalStyle.input, modalStyle.timeInput]}
                  placeholder="MM"
                  placeholderTextColor={mainColors.foreground + "50"}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={minute}
                  onChangeText={(text) => {
                    const num = parseInt(text) || 0;
                    if (num >= 0 && num <= 59) {
                      setMinute(text);
                    }
                  }}
                  editable={!isSubmitting}
                />
                <View style={modalStyle.amPmContainer}>
                  <TouchableOpacity
                    style={[
                      modalStyle.amPmButton,
                      !isPM && modalStyle.amPmButtonActive
                    ]}
                    onPress={() => setIsPM(false)}
                    disabled={isSubmitting}
                  >
                    <Text style={[
                      modalStyle.amPmText,
                      !isPM && modalStyle.amPmTextActive
                    ]}>AM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      modalStyle.amPmButton,
                      isPM && modalStyle.amPmButtonActive
                    ]}
                    onPress={() => setIsPM(true)}
                    disabled={isSubmitting}
                  >
                    <Text style={[
                      modalStyle.amPmText,
                      isPM && modalStyle.amPmTextActive
                    ]}>PM</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
                  {isSubmitting ? "Saving..." : editingSchedule ? "Update" : "Save"}
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
  timeDisplayContainer: {
    backgroundColor: mainColors.background,
    borderWidth: 1,
    borderColor: mainColors.accent,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  timeDisplayText: {
    fontSize: 18,
    fontWeight: "600",
    color: mainColors.foreground,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeInput: {
    flex: 1,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: "bold",
    color: mainColors.foreground,
  },
  amPmContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  amPmButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: mainColors.accent,
    borderRadius: 8,
    backgroundColor: mainColors.background,
  },
  amPmButtonActive: {
    backgroundColor: mainColors.primary,
  },
  amPmText: {
    fontSize: 14,
    fontWeight: "600",
    color: mainColors.foreground + "80",
  },
  amPmTextActive: {
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

export default SetScheduleFeed;