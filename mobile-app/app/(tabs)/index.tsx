import { buttonS } from "@/styles/buttons";
import { mainColors } from "@/utils/global-theme";
import Feather from '@expo/vector-icons/Feather';
import { useBLEContext } from "@/contexts/BLEprovider";
import { StyleSheet, Text, TouchableOpacity, View, Alert } from "react-native";
import { useState, useEffect } from "react";
import SetBiomassModal from "@/components/setBiomassModal";
import { useAveWeight, useFishCount } from "@/contexts/DBprovider";
import { calculateFeedAmount } from "@/actions/send-templogs";
import { toggleServo } from "@/actions/servo-actions";
import { Pause, Play, Zap } from 'lucide-react-native'

export default function Home() {
  const {
    connectedDevice,
    weight,
    temperature,
    sendCommand,
    isServoClosed,
    isServoRunning,
    startFeedingSession,
    endFeedingSession,
  } = useBLEContext();
  const { latestAveWeight, refreshAveWeights } = useAveWeight();
  const { latestFishCount, refreshFishCounts } = useFishCount();
  const [showBiomassModal, setShowBiomassModal] = useState(false);

  // Local state to force re-renders
  const [servoStatus, setServoStatus] = useState({
    running: false,
    closed: true
  });

  const MAX_WEIGHT = 10; // Maximum weight capacity in kg

  // Update local state when BLE context changes
  useEffect(() => {
    setServoStatus({
      running: isServoRunning,
      closed: isServoClosed
    });
    console.log("Servo state updated - Running:", isServoRunning, "Closed:", isServoClosed);
  }, [isServoRunning, isServoClosed]);

  const handleModalClose = async () => {
    setShowBiomassModal(false);
    await refreshAveWeights();
    await refreshFishCounts();
  };

  const handleToggleServo = async () => {
    if (!connectedDevice) {
      Alert.alert('Error', 'Please connect to device first');
      return;
    }
    try {
      await toggleServo(servoStatus.closed, sendCommand, startFeedingSession, endFeedingSession);
    } catch (error) {
      Alert.alert('Error', 'Failed to control servo');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate biomass (ABW * Fish Count) in kg
  const calculateBiomass = () => {
    if (latestAveWeight?.weight && latestFishCount?.count) {
      return (latestAveWeight.weight * latestFishCount.count / 1000).toFixed(2);
    }
    return 'N/A';
  };

  // Calculate automatic feed amount
  const getAutoFeedAmount = () => {
    const biomass = calculateBiomass();
    if (biomass === 'N/A') return 'N/A';
    const feedAmount = calculateFeedAmount(parseFloat(biomass), temperature);
    return typeof feedAmount === 'number' ? feedAmount.toFixed(2) : feedAmount;
  };

  const autoFeedAmount = getAutoFeedAmount();

  // Calculate weight percentage, capped at 100%
  const weightPercentage = Math.min(((weight / MAX_WEIGHT) * 100), 100).toFixed(1);

  // Auto feed function
  const handleAutoFeed = async () => {
    if (!connectedDevice) {
      Alert.alert('Error', 'Please connect to device first');
      return;
    }

    if (autoFeedAmount === 'N/A') {
      Alert.alert('Error', 'Cannot calculate feed amount. Please set biomass data first.');
      return;
    }

    const currentWeight = parseFloat(weightPercentage);
    const feedAmount = parseFloat(autoFeedAmount);

    // Check if there's enough feed in the container
    if (currentWeight < 10) {
      Alert.alert('Warning', 'Feed level is low. Please refill the container.');
      return;
    }

    try {
      // Calculate feeding duration based on feed amount
      // Assuming 1 kg/day = continuous running for proportional time
      // Adjust the multiplier based on your servo's actual dispensing rate
      const durationSeconds = Math.min(feedAmount * 10, 60); // Max 60 seconds

      Alert.alert(
        'Auto Feed',
        `Starting automatic feeding for ${durationSeconds.toFixed(0)} seconds\nDispensing approximately ${feedAmount} kg`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start',
            onPress: async () => {
              await sendCommand("RUN");

              // Stop after calculated duration
              setTimeout(async () => {
                await sendCommand("STOP");
                Alert.alert('Success', 'Auto feeding completed');
              }, durationSeconds * 1000);
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to start auto feeding');
    }
  };

  return (
    <View style={styles.base}>

      {/* info boxes */}
      <View style={styles.box}>
        <View style={styles.container}>
          <Text style={styles.text}>Water Temperature</Text>
          <Text style={styles.textValue}>{temperature}°C</Text>
          <Text style={styles.text}>Optimal</Text>
        </View>
        <View style={styles.container}>
          <Text style={styles.text}>Feed Level</Text>
          <Text style={styles.textValue}>{weightPercentage}%</Text>
          <Text style={styles.text}>Refil Soon</Text>
        </View>
      </View>
      <View style={styles.box1}>
        <View style={styles.container1}>
          <Text style={styles.text1}>ABW</Text>
          <Text style={styles.textValue}>
            {latestAveWeight?.weight ? `${latestAveWeight.weight} kg` : 'N/A'}
          </Text>
          <Text style={styles.text}>
            {latestAveWeight?.date ? formatDate(latestAveWeight.date) : '-'}
          </Text>
        </View>
        <View style={styles.container1}>
          <Text style={styles.text}>No. of Fish</Text>
          <Text style={styles.textValue}>
            {latestFishCount?.count ?? 'N/A'}
          </Text>
          <Text style={styles.text}>
            {latestFishCount?.date ? formatDate(latestFishCount.date) : '-'}
          </Text>
        </View>
        <View style={styles.container1}>
          <Text style={styles.text}>Biomass</Text>
          <Text style={styles.textValue}>{calculateBiomass()} kg</Text>
        </View>
      </View>

      <TouchableOpacity
        style={buttonS.secondary}
        onPress={() => setShowBiomassModal(true)}
      >
        <Text style={styles.textValue2}>Set Biomass</Text>
      </TouchableOpacity>

      {/* Dispense Feed */}
      <View style={styles.dispenseFeedBox}>
        <Text style={styles.title}>Dispense Feed</Text>

        {/* Servo Status Display */}
        <View style={styles.servoStatusBox}>
          <Text style={[styles.text, { fontWeight: 'bold' }]}>
            Status: {servoStatus.running ? '🟢 Running' : '🔴 Stopped'}
          </Text>
          <Text style={styles.text}>
            Position: {servoStatus.closed ? 'Closed' : 'Open'}
          </Text>
        </View>

        <View style={styles.box}>
          <View style={styles.feedInfoContainer}>
            <Text style={styles.feedLabel}>Daily Feed Rate:</Text>
            <Text style={styles.textValue2}>
              {autoFeedAmount === 'N/A' ? 'N/A' : `${autoFeedAmount} kg/day`}
            </Text>
            {autoFeedAmount !== 'N/A' && (
              <Text style={styles.feedSubtext}>
                Based on {calculateBiomass()} kg biomass at {temperature}°C
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={[
            buttonS.primary,
            (!connectedDevice || autoFeedAmount === 'N/A') && { opacity: 0.5 }
          ]}
          onPress={handleAutoFeed}
          disabled={!connectedDevice || autoFeedAmount === 'N/A'}
        >
          <Zap color={mainColors.foreground} />
          <Text style={styles.textValue2}>Auto Feed</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            buttonS.secondary,
            !connectedDevice && { opacity: 0.5 }
          ]}
          onPress={handleToggleServo}
          disabled={!connectedDevice}
        >
          {servoStatus.running ? (
            <Pause color={mainColors.foreground} />
          ) : (
            <Play color={mainColors.foreground} />
          )}
          <Text style={styles.textValue2}>
            {servoStatus.running ? 'Stop Feeding' : 'Start Feeding'}
          </Text>
        </TouchableOpacity>

      </View>

      <SetBiomassModal
        visible={showBiomassModal}
        closeModal={handleModalClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 14,
    backgroundColor: mainColors.background,
  },
  header: {
    minWidth: "100%",
    backgroundColor: mainColors.primary,
    padding: 10,
  },
  box: {
    alignContent: "center",
    justifyContent: "center",
    flexDirection: "row",
    minWidth: "100%",
    padding: 10,
    gap: 6,
  },
  box1: {
    flexDirection: "row",
    alignContent: "center",
    justifyContent: "center",
    minWidth: "100%",
    padding: 10,
    gap: 6,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: mainColors.accent,
    borderRadius: mainColors.sm,
    gap: 2,
  },
  container1: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    gap: 2,
  },
  dispenseFeedBox: {
    flex: 1,
    padding: 10,
    minWidth: "100%",
    marginTop: 20,
    gap: 6,
  },
  servoStatusBox: {
    padding: 10,
    backgroundColor: mainColors.accent,
    borderWidth: 1,
    borderColor: mainColors.primary,
    borderRadius: mainColors.sm,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: mainColors.foreground,
  },
  disconnectedText: {
    color: mainColors.destructive,
  },
  connectedText: {
    color: mainColors.primaryForeground,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  textValue: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
    fontWeight: "bold",
    color: mainColors.foreground,
  },
  textValue2: {
    flexDirection: "row",
    alignSelf: "center",
    fontWeight: "bold",
    color: mainColors.foreground,
  },
  text: {
    color: mainColors.foreground,
  },
  text1: {
    textAlign: "left",
    color: mainColors.foreground,
  },
  feedInfoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  feedLabel: {
    color: mainColors.foreground,
  },
  feedSubtext: {
    color: mainColors.foreground,
    fontSize: 12,
  }
})