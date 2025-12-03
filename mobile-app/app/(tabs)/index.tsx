import { buttonS } from "@/styles/buttons";
import { mainColors } from "@/utils/global-theme";
import Feather from '@expo/vector-icons/Feather';
import { useBLEContext } from "@/contexts/BLEprovider";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useState } from "react";
import SetBiomassModal from "@/components/setBiomassModal";
import { useAveWeight, useFishCount } from "@/contexts/DBprovider";
import { calculateFeedAmount } from "@/actions/send-templogs";


export default function Home() {
  const { connectedDevice, weight, temperature } = useBLEContext();
  const { latestAveWeight, refreshAveWeights } = useAveWeight();
  const { latestFishCount, refreshFishCounts } = useFishCount();
  const [showBiomassModal, setShowBiomassModal] = useState(false);
  const MAX_WEIGHT = 100; // Maximum weight capacity in kg

  const handleModalClose = async () => {
    setShowBiomassModal(false);
    await refreshAveWeights();
    await refreshFishCounts();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate biomass (ABW * Fish Count)
  const calculateBiomass = () => {
    if (latestAveWeight?.weight && latestFishCount?.count) {
      return (latestAveWeight.weight * latestFishCount.count).toFixed(2);
    }
    return 'N/A';
  };

  // Calculate automatic feed amount
  const getAutoFeedAmount = () => {
    const biomass = calculateBiomass();
    if (biomass === 'N/A') return 'N/A';
    return calculateFeedAmount(parseFloat(biomass), temperature);
  };

  const autoFeedAmount = getAutoFeedAmount();

  // Calculate weight percentage
  const weightPercentage = ((weight / MAX_WEIGHT) * 100).toFixed(1);

  return (
    <View style={styles.base}>

      {/* info boxes */}
      <View style={styles.box}>
        <View style={styles.container}>
          <Text style={styles.text}>Water Temperature</Text>
          {/* <Thermometer /> */}
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
          {/* <Thermometer /> */}
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
        <TouchableOpacity style={buttonS.primary}>
          <Feather name="check" size={24} color={mainColors.foreground} />
          <Text style={styles.textValue2}>Feed Now</Text>
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