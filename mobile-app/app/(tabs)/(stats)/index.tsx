import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { mainColors } from '@/utils/global-theme'
import { ChartPie } from "lucide-react-native"
import { LineChart } from "react-native-gifted-charts";

export default function Stats() {
  return (
    <View style={styles.base}>
      <Text style={styles.title}>Water Temperature Graph</Text>
      <Chart />
      <View style={styles.descBox}>
        <Text style={styles.title}>Water Temperature Graph</Text>
      </View>
    </View>
  )
}

function Chart() {
  const data = [
    { value: 15 },
    { value: 30 },
    { value: 26 },
    { value: 15 },
    { value: 30 },
    { value: 26 },
    { value: 15 },
    { value: 30 },
    { value: 26 },
    { value: 40 }
  ];

  return (
    <LineChart
      areaChart
      data={data}
      curved
      noOfSections={5}
      yAxisThickness={0}
      xAxisThickness={0}
      color={mainColors.primary}
      startFillColor1={mainColors.primary}
    />
  );
};

const styles = StyleSheet.create({
  base: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 2,
    backgroundColor: mainColors.background,
  },
  title: {
    fontWeight: "bold",
  },
  descBox: {
    flex: 11,
    width: "100%",
    marginVertical: 20,
    padding: 10,
    backgroundColor: mainColors.secondary,
    borderRadius: mainColors.sm,
  }
})