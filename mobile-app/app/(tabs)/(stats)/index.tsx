import { StyleSheet, Text, View, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import { mainColors } from '@/utils/global-theme'
import { LineChart } from "react-native-gifted-charts";
import { useTempLogs } from '@/contexts/DBprovider';
import type { TempLogType } from '@/database/db-schema';

export default function Stats() {
  const { tempLogs, refreshTempLogs } = useTempLogs();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await refreshTempLogs();
      setIsLoading(false);
    };
    loadData();

    // Refresh data every 10 seconds for real-time updates
    const interval = setInterval(() => {
      refreshTempLogs();
    }, 10000);

    return () => clearInterval(interval);
  }, [refreshTempLogs]);

  if (isLoading) {
    return (
      <View style={[styles.base, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={mainColors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.base}>
      <Text style={styles.title}>Water Temperature Graph</Text>
      <Chart tempLogs={tempLogs} />
      <View style={styles.descBox}>
        <Text style={styles.title}>Temperature Statistics</Text>
        <Text style={styles.stats}>Total Readings: {tempLogs.length}</Text>
        {tempLogs.length > 0 && (
          <>
            <Text style={styles.stats}>
              Latest: {tempLogs[0].temperature.toFixed(1)}°C
            </Text>
            <Text style={styles.stats}>
              Average: {(tempLogs.reduce((sum, log) => sum + log.temperature, 0) / tempLogs.length).toFixed(1)}°C
            </Text>
          </>
        )}
      </View>
    </View>
  )
}

function Chart({ tempLogs }: { tempLogs: TempLogType[] }) {
  // Convert temp logs to chart data format (reversed to show oldest to newest)
  const data = tempLogs
    .slice()
    .reverse()
    .map((log) => ({
      value: log.temperature,
      label: new Date(log.date_created).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
    }));

  // Show message if no data
  if (data.length === 0) {
    return (
      <View style={styles.noDataContainer}>
        <Text style={styles.noDataText}>No temperature data available</Text>
      </View>
    );
  }

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
      height={250}
      width={320}
      initialSpacing={10}
      endSpacing={10}
    />
  );
}

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
    fontSize: 16,
    marginVertical: 10,
  },
  descBox: {
    flex: 1,
    width: "100%",
    marginVertical: 20,
    padding: 10,
    backgroundColor: mainColors.secondary,
    borderRadius: mainColors.sm,
  },
  stats: {
    fontSize: 14,
    marginVertical: 5,
  },
  noDataContainer: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
  }
})