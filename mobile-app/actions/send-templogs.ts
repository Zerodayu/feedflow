import { useSQLiteContext } from "expo-sqlite";
import { useCallback } from "react";
import type { SQLiteDatabase } from "expo-sqlite";
import type { TempLogType } from "../database/db-schema";
import { syncDatabase } from "./sync-db";

export async function sendTempLog(db: SQLiteDatabase, temperature: number) {
  try {
    await db.runAsync(
      `INSERT INTO temp_logs (temperature, date_created) VALUES (?, ?)`,
      [temperature, new Date().toISOString()]
    );
    console.log("Temperature log inserted successfully:", temperature);

    // Sync to cloud after inserting
    await syncDatabase(db);

    return { success: true };
  } catch (error) {
    console.error("Failed to insert temperature log:", error);
    return { success: false, error };
  }
}

export function useSendTempLogs() {
  const db = useSQLiteContext();

  const fetchTempLogs = useCallback(async () => {
    try {
      const logs = await db.getAllAsync<TempLogType>(
        'SELECT * FROM temp_logs ORDER BY date_created DESC'
      );
      console.log('Fetched temp logs:', logs);
      return logs;
    } catch (error) {
      console.error('Failed to fetch temp logs:', error);
      return [];
    }
  }, [db]);

  const handleSendTempLog = useCallback(async (temperature: number) => {
    const result = await sendTempLog(db, temperature);
    if (result.success) {
      console.log(`Successfully inserted temperature: ${temperature}`);
    } else {
      console.error('Failed to insert temperature log:', result.error);
    }
    return result;
  }, [db]);

  return { handleSendTempLog, fetchTempLogs };
}