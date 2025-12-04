import { StyleSheet, Text, View, FlatList, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import { mainColors } from '@/utils/global-theme'
import { History } from "lucide-react-native"
import { useFeedLogs } from '@/contexts/DBprovider'

export default function Stats() {
  const { feedLogs, refreshFeedLogs } = useFeedLogs();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await refreshFeedLogs();
      setIsLoading(false);
    };
    loadData();

    // Refresh data every 10 seconds for real-time updates
    const interval = setInterval(() => {
      refreshFeedLogs();
    }, 10000);

    return () => clearInterval(interval);
  }, [refreshFeedLogs]);

  if (isLoading) {
    return (
      <View style={[styles.base, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={mainColors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.base}>
      <Text style={styles.title}>Feeding Logs</Text>
      <View style={styles.statsBox}>
        <Text style={styles.statsText}>Total Feeds: {feedLogs.length}</Text>
        {feedLogs.length > 0 && (
          <>
            <Text style={styles.statsText}>
              Latest: {feedLogs[0].level} kg at {feedLogs[0].temp}°C
            </Text>
            <Text style={styles.statsText}>
              Total Dispensed: {feedLogs.reduce((sum, log) => sum + parseFloat(log.level.toString()), 0).toFixed(2)} kg
            </Text>
          </>
        )}
      </View>
      <View style={styles.listBox}>
        {feedLogs.length === 0 ? (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No feeding logs available</Text>
          </View>
        ) : (
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
                      {new Date(item.date_created).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })}
                    </Text>
                  </View>
                </View>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemText}>Weight Used: {item.level} kg</Text>
                  <Text style={styles.itemText}>Avg Temp: {item.temp}°C</Text>
                </View>
              </View>
            )}
            showsVerticalScrollIndicator={true}
          />
        )}
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
    fontSize: 16,
    marginBottom: 10,
  },
  statsBox: {
    width: "100%",
    padding: 10,
    backgroundColor: mainColors.secondary,
    borderRadius: mainColors.sm,
    marginBottom: 10,
  },
  statsText: {
    fontSize: 14,
    marginVertical: 2,
  },
  listBox: {
    flex: 1,
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: mainColors.accent,
    padding: 10,
    marginTop: 10,
  },
  listItems: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: mainColors.secondary,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  itemTitle: {
    fontWeight: "bold",
    color: mainColors.primary,
    fontSize: 14,
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
  },
  itemDetails: {
    gap: 4,
  },
  itemText: {
    fontSize: 13,
    color: mainColors.foreground,
  },
  noDataContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
  }
})