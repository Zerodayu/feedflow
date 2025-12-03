import { useSQLiteContext } from "expo-sqlite";
import { useCallback } from "react";
import type { SQLiteDatabase } from "expo-sqlite";
import type { TempLogType } from "../database/db-schema";
import { syncDatabase } from "./sync-db";

export async function sendTempLogs(db: SQLiteDatabase) {
  const dummyLogs: Omit<TempLogType, "id">[] = [
    {
      temperature: 22.5,
      date_created: new Date().toISOString(),
    },
    {
      temperature: 24.3,
      date_created: new Date().toISOString(),
    },
    {
      temperature: 21.8,
      date_created: new Date().toISOString(),
    },
  ];

  try {
    for (const log of dummyLogs) {
      await db.runAsync(
        `INSERT INTO temp_logs (temperature, date_created) VALUES (?, ?)`,
        [log.temperature, log.date_created]
      );
    }
    console.log("Dummy temp logs inserted successfully");

    // Sync to cloud after inserting
    await syncDatabase(db);

    return { success: true, count: dummyLogs.length };
  } catch (error) {
    console.error("Failed to insert dummy temp logs:", error);
    return { success: false, error };
  }
}

export function useSendTempLogs() {
  const db = useSQLiteContext();

  const fetchTempLogs = useCallback(async () => {
    try {
      const logs = await db.getAllAsync<TempLogType>('SELECT * FROM temp_logs ORDER BY date_created DESC');
      console.log('Fetched temp logs:', logs);
      return logs;
    } catch (error) {
      console.error('Failed to fetch temp logs:', error);
      return [];
    }
  }, [db]);

  const syncTempLogs = useCallback(async () => {
    console.log('Syncing temp logs with Turso DB...');

    try {
      await syncDatabase(db);
      await fetchTempLogs();
      console.log('Synced temp logs with Turso DB');
    } catch (e) {
      console.log(e);
    }
  }, [db, fetchTempLogs]);

  const handleSendLogs = async () => {
    const result = await sendTempLogs(db);
    if (result.success) {
      console.log(`Successfully inserted ${result.count} logs`);
      await syncTempLogs();
    } else {
      console.error('Failed to insert logs:', result.error);
    }
    return result;
  };

  return { handleSendLogs, syncTempLogs, fetchTempLogs };
}