import { buttonS } from "@/styles/buttons";
import { mainColors } from "@/utils/global-theme";
import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Home() {
  const tempText = 0;
  const feedLvlText = 0;
  const DispenseFeedText = 0;

  return (
    <View style={styles.base}>
      {/* header */}
      <View style={styles.header}>
        <Text style={styles.title}>FeedFlow</Text>
        <Text style={styles.statusText}>Disconnected</Text>
      </View>

      {/* info boxes */}
      <View style={styles.box}>
        <View style={styles.container}>
          <Text style={styles.text}>Water Temperature</Text>
          {/* <Thermometer /> */}
          <Text style={styles.textValue}>{tempText}°C</Text>
          <Text style={styles.text}>Optimal</Text>
        </View>
        <View style={styles.container}>
          <Text style={styles.text}>Feed Level</Text>
          <Text style={styles.textValue}>{feedLvlText}%</Text>
          <Text style={styles.text}>Refil Soon</Text>
        </View>
      </View>

      {/* Dispense Feed */}
      <View style={styles.dispenseFeedBox}>
        <Text style={styles.title}>Dispense Feed</Text>
        <View style={styles.box}>
          <TouchableOpacity style={buttonS.primary}>
            <Feather name="plus" size={24} color={mainColors.foreground} />
          </TouchableOpacity>
          <Text style={styles.textValue2}>{DispenseFeedText} kg</Text>
          <TouchableOpacity style={buttonS.primary}>
            <Feather name="minus" size={24} color={mainColors.foreground} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={buttonS.primary}>
          <Feather name="check" size={24} color={mainColors.foreground} />
          <Text style={styles.textValue2}>Feed Now</Text>
        </TouchableOpacity>
      </View>
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
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 4,
    gap: 2,
  },
  dispenseFeedBox: {
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
  statusText: {
    color: mainColors.destructive,
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
  }
})