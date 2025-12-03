import { StyleSheet, Text, View, FlatList } from 'react-native'
import { mainColors } from '@/utils/global-theme'
import React from 'react'

export default function Alerts() {
  return (
    <View style={styles.base}>
      <Text>Alerts</Text>
      <AlertList />
    </View>
  )
}

function AlertList() {
  const dummyAlerts = [
    { id: 1, subject: "Low Feed Level", body: "The feed level is below 20%. Please refill the feeder.", date_created: "2024-06-01 10:00" },
    { id: 2, subject: "High Water Temperature", body: "The water temperature has exceeded the optimal range.", date_created: "2024-06-02 14:30" },
    { id: 3, subject: "Feeding Completed", body: "The scheduled feeding has been completed successfully.", date_created: "2024-06-03 09:15" },
  ]

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <FlatList
      data={dummyAlerts}
      renderItem={({ item }) => (
        <View style={styles.alertItem}>
          <Text style={styles.alertSubj}>{item.subject}</Text>
          <Text style={styles.alertBody}>{item.body}</Text>
          <Text style={styles.alertDate}>{formatDate(item.date_created)}</Text>
        </View>
      )}
      keyExtractor={(item) => item.id.toString()}
    />
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
  alertList: {
    flex: 1,
    width: "100%",
  },
  alertItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: mainColors.secondary,

  },
  alertSubj: {
    fontWeight: "bold",
    color: mainColors.primary,
  },
  alertBody: {
    color: mainColors.foreground,
    marginHorizontal: 8,
     marginVertical: 4,
  },
  alertDate: {
    color: mainColors.primary+70,
  }
})