import { useSQLiteContext } from "expo-sqlite";
import { useCallback } from "react";
import type { SQLiteDatabase } from "expo-sqlite";
import type { FeedLogtype } from "../database/db-schema";
import { syncDatabase } from "./sync-db";

export async function sendFeedLogs(db: SQLiteDatabase) {
  const dummyLogs: Omit<FeedLogtype, "id">[] = [
    {
      title: "Morning Feed",
      level: 123.2,
      temp: 22,
      date_created: new Date().toISOString(),
    },
    {
      title: "Afternoon Feed",
      level: 50.12,
      temp: 24,
      date_created: new Date().toISOString(),
    },
    {
      title: "Evening Feed",
      level: 25.123,
      temp: 21,
      date_created: new Date().toISOString(),
    },
  ];

  try {
    for (const log of dummyLogs) {
      await db.runAsync(
        `INSERT INTO feed_logs (title, level, temp, date_created) VALUES (?, ?, ?, ?)`,
        [log.title, log.level, log.temp, log.date_created]
      );
    }
    console.log("Dummy feed logs inserted successfully");

    // Sync to cloud after inserting
    await syncDatabase(db);

    return { success: true, count: dummyLogs.length };
  } catch (error) {
    console.error("Failed to insert dummy feed logs:", error);
    return { success: false, error };
  }
}

export function useSendFeedLogs() {
  const db = useSQLiteContext();

  const fetchFeedLogs = useCallback(async () => {
    try {
      const logs = await db.getAllAsync<FeedLogtype>('SELECT * FROM feed_logs ORDER BY date_created DESC');
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

  const handleSendLogs = async () => {
    const result = await sendFeedLogs(db);
    if (result.success) {
      console.log(`Successfully inserted ${result.count} logs`);
      await syncFeedLogs();
    } else {
      console.error('Failed to insert logs:', result.error);
    }
    return result;
  };

  return { handleSendLogs, syncFeedLogs, fetchFeedLogs };
}