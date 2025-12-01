import { mainColors } from "@/utils/global-theme";
import { StyleSheet, Text, View } from "react-native";

export default function Home() {
  return (
    <View style={styles.base}>
      <View style={styles.header}>
        <Text style={styles.text}>Home Screen</Text>
      </View>
      <Text style={styles.text}>Edit app/(tabs)/home.tsx to edit this screen.</Text>
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
  text: {
    color: mainColors.foreground,
  }
})