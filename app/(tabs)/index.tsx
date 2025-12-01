import { buttonS } from "@/styles/buttons";
import { mainColors } from "@/utils/global-theme";
import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Home() {
  const tempText = 0;
  const feedLvlText = 0;

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
      <View >
        <Text>Dispense Feed</Text>
        <View>
          <TouchableOpacity style={buttonS.primary}>
            <Feather name="plus" size={24} color={mainColors.foreground} />
          </TouchableOpacity>
        </View>
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
  text: {
    color: mainColors.foreground,
  }
})