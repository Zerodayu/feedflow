import { StyleSheet, Text, View, FlatList } from 'react-native'
import React from 'react'
import { mainColors } from '@/utils/global-theme'
import { History } from "lucide-react-native"
import { LineChart } from "react-native-gifted-charts";

const feedLogs = [
  { id: 1, title: "Morning Feed", level: "3.45", temp: "22.5", last_updated: "2024-06-01T08:00:00Z" },
  { id: 2, title: "Afternoon Feed", level: "4.20", temp: "23.0", last_updated: "2024-06-01T12:00:00Z" },
  { id: 3, title: "Evening Feed", level: "3.80", temp: "21.8", last_updated: "2024-06-01T18:00:00Z" },

]

export default function Stats() {
  return (
    <View style={styles.base}>
      <Text style={styles.title}>Feeding Logs</Text>
      <View style={styles.listBox}>
        <FlatList
          data={feedLogs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.listItems}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <View style={styles.itemDate}>
                  <History size={10} />
                  <Text style={styles.itemDateText}>
                    {new Date(item.last_updated).toLocaleString()}
                  </Text>
                </View>
              </View>
              <Text>{item.level} kg</Text>
              <Text>{item.temp} °C</Text>
            </View>
          )}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 14,
    backgroundColor: mainColors.background,
  },
  title: {
    fontWeight: "bold",
  },
  listBox: {
    flex: 1,
    width: "100%",
    borderTopWidth: 1,
    padding: 10,
    marginTop: 10,
  },
  listItems: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: mainColors.secondary,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  itemTitle: {
    fontWeight: "bold",
    color: mainColors.primary,
  },
  itemDateText: {
    fontFamily: "monospace",
    fontSize: 10,
    fontWeight: "bold",
  },
  itemDate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: mainColors.accent + 80,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: mainColors.sm,
  }
})