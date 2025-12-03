import { useSQLiteContext } from "expo-sqlite";
import { useCallback } from "react";
import type { SQLiteDatabase } from "expo-sqlite";
import type { total_fish } from "../database/db-schema";
import { syncDatabase } from "./sync-db";

export async function sendFishCount(db: SQLiteDatabase, count: number) {
  const fishCountLog: Omit<total_fish, "id"> = {
    count,
    date: new Date().toISOString(),
  };

  try {
    await db.runAsync(
      `INSERT INTO total_fish (count, date) VALUES (?, ?)`,
      [fishCountLog.count, fishCountLog.date]
    );
    console.log("Fish count log inserted successfully");

    // Sync to cloud after inserting
    await syncDatabase(db);

    return { success: true };
  } catch (error) {
    console.error("Failed to insert fish count log:", error);
    return { success: false, error };
  }
}

export function useSendFishCount() {
  const db = useSQLiteContext();

  const fetchFishCounts = useCallback(async () => {
    try {
      const logs = await db.getAllAsync<total_fish>(
        'SELECT * FROM total_fish ORDER BY date DESC'
      );
      console.log('Fetched fish count logs:', logs);
      return logs;
    } catch (error) {
      console.error('Failed to fetch fish count logs:', error);
      return [];
    }
  }, [db]);

  const syncFishCounts = useCallback(async () => {
    console.log('Syncing fish count logs with Turso DB...');

    try {
      await syncDatabase(db);
      await fetchFishCounts();
      console.log('Synced fish count logs with Turso DB');
    } catch (e) {
      console.log(e);
    }
  }, [db, fetchFishCounts]);

  const handleSendFishCount = async (count: number) => {
    const result = await sendFishCount(db, count);
    if (result.success) {
      console.log(`Successfully inserted fish count: ${count}`);
      await syncFishCounts();
    } else {
      console.error('Failed to insert fish count:', result.error);
    }
    return result;
  };

  return { handleSendFishCount, syncFishCounts, fetchFishCounts };
}