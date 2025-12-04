import { StyleSheet, Text, View, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native'
import { mainColors } from '@/utils/global-theme'
import React, { useEffect, useState } from 'react'
import { useAlertLogs } from '@/contexts/DBprovider'
import { Trash } from 'lucide-react-native'

export default function Alerts() {
  const { alertLogs, refreshAlerts } = useAlertLogs();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await refreshAlerts();
      setIsLoading(false);
    };
    loadData();

    // Refresh data every 60 seconds for real-time updates
    const interval = setInterval(() => {
      refreshAlerts();
    }, 60000);

    return () => clearInterval(interval);
  }, [refreshAlerts]);

  if (isLoading) {
    return (
      <View style={[styles.base, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={mainColors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.base}>
      <View style={styles.header}>
        <Text style={styles.title}>Alerts</Text>
        <Text style={styles.count}>Total: {alertLogs.length}</Text>
      </View>
      <AlertList />
    </View>
  )
}

function AlertList() {
  const { alertLogs, refreshAlerts, deleteAlert } = useAlertLogs();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAlerts();
    setRefreshing(false);
  };

  const handleDeleteAlert = async (id: number) => {
    try {
      await deleteAlert(id);
      console.log('Alert deleted:', id);
    } catch (error) {
      console.error('Failed to delete alert:', error);
    }
  };

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
      data={alertLogs}
      style={styles.alertList}
      renderItem={({ item }) => (
        <View style={styles.alertItem}>
          <View style={styles.alertContent}>
            <Text style={styles.alertSubj}>{item.subject}</Text>
            <Text style={styles.alertBody}>{item.body}</Text>
            <Text style={styles.alertDate}>{formatDate(item.date_created)}</Text>
          </View>
          <TouchableOpacity
            onPress={() => handleDeleteAlert(item.id)}
            style={styles.deleteButton}
          >
            <Trash color={mainColors.destructive} />
          </TouchableOpacity>
        </View>
      )}
      keyExtractor={(item) => item.id.toString()}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No alerts yet</Text>
        </View>
      }
      contentContainerStyle={alertLogs.length === 0 ? styles.emptyList : undefined}
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
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: mainColors.primary,
  },
  count: {
    fontSize: 16,
    fontWeight: '600',
    color: mainColors.primary,
  },
  alertList: {
    flex: 1,
    width: "100%",
  },
  alertItem: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 8,
    backgroundColor: mainColors.secondary,
    borderRadius: mainColors.sm,
    alignItems: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertSubj: {
    fontWeight: "bold",
    color: mainColors.primary,
    fontSize: 16,
    marginBottom: 4,
  },
  alertBody: {
    color: mainColors.foreground,
    marginVertical: 4,
    fontSize: 14,
  },
  alertDate: {
    color: mainColors.primary + '70',
    fontSize: 12,
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: mainColors.destructive + '50',
    borderRadius: mainColors.radius,
  },
  deleteText: {
    color: '#ff4444',
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: mainColors.foreground,
    fontSize: 16,
  },
  emptyList: {
    flexGrow: 1,
  }
})