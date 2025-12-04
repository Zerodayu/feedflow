import { useSQLiteContext } from "expo-sqlite";
import { useCallback } from "react";
import type { SQLiteDatabase } from "expo-sqlite";
import type { FeedLogtype } from "../database/db-schema";
import { syncDatabase } from "./sync-db";

export async function createFeedLog(
  db: SQLiteDatabase,
  weightUsed: number,
  avgTemp: number
) {
  try {
    const now = new Date();
    const title = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    await db.runAsync(
      `INSERT INTO feed_logs (title, level, temp, date_created) VALUES (?, ?, ?, ?)`,
      [title, weightUsed, avgTemp, now.toISOString()]
    );
    console.log("Feed log created:", { title, weightUsed, avgTemp });

    // Sync to cloud after inserting
    await syncDatabase(db);

    return { success: true };
  } catch (error) {
    console.error("Failed to create feed log:", error);
    return { success: false, error };
  }
}

export function useSendFeedLogs() {
  const db = useSQLiteContext();

  const fetchFeedLogs = useCallback(async () => {
    try {
      const logs = await db.getAllAsync<FeedLogtype>(
        'SELECT * FROM feed_logs ORDER BY date_created DESC'
      );
      console.log('Fetched feed logs:', logs);
      return logs;
    } catch (error) {
      console.error('Failed to fetch feed logs:', error);
      return [];
    }
  }, [db]);

  const syncFeedLogs = useCallback(async () => {
    console.log('Syncing feed logs with Turso DB...');

    try {
      await syncDatabase(db);
      await fetchFeedLogs();
      console.log('Synced feed logs with Turso DB');
    } catch (e) {
      console.log(e);
    }
  }, [db, fetchFeedLogs]);

  const handleCreateFeedLog = useCallback(
    async (weightUsed: number, avgTemp: number) => {
      const result = await createFeedLog(db, weightUsed, avgTemp);
      if (result.success) {
        console.log(`Feed log created: ${weightUsed}kg at ${avgTemp}°C`);
        await syncFeedLogs();
      } else {
        console.error('Failed to create feed log:', result.error);
      }
      return result;
    },
    [db, syncFeedLogs]
  );

  return { handleCreateFeedLog, syncFeedLogs, fetchFeedLogs };
}