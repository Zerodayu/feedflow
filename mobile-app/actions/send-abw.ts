import { useSQLiteContext } from "expo-sqlite";
import { useCallback } from "react";
import type { SQLiteDatabase } from "expo-sqlite";
import type { ave_weight } from "../database/db-schema";
import { syncDatabase } from "./sync-db";

export async function sendAveWeight(db: SQLiteDatabase, weight: number) {
  const aveWeightLog: Omit<ave_weight, "id"> = {
    weight,
    date: new Date().toISOString(),
  };

  try {
    await db.runAsync(
      `INSERT INTO ave_weight (weight, date) VALUES (?, ?)`,
      [aveWeightLog.weight, aveWeightLog.date]
    );
    console.log("Average weight log inserted successfully");

    // Sync to cloud after inserting
    await syncDatabase(db);

    return { success: true };
  } catch (error) {
    console.error("Failed to insert average weight log:", error);
    return { success: false, error };
  }
}

export function useSendAveWeight() {
  const db = useSQLiteContext();

  const fetchAveWeights = useCallback(async () => {
    try {
      const logs = await db.getAllAsync<ave_weight>(
        'SELECT * FROM ave_weight ORDER BY date DESC'
      );
      console.log('Fetched average weight logs:', logs);
      return logs;
    } catch (error) {
      console.error('Failed to fetch average weight logs:', error);
      return [];
    }
  }, [db]);

  const syncAveWeights = useCallback(async () => {
    console.log('Syncing average weight logs with Turso DB...');

    try {
      await syncDatabase(db);
      await fetchAveWeights();
      console.log('Synced average weight logs with Turso DB');
    } catch (e) {
      console.log(e);
    }
  }, [db, fetchAveWeights]);

  const handleSendAveWeight = async (weight: number) => {
    const result = await sendAveWeight(db, weight);
    if (result.success) {
      console.log(`Successfully inserted average weight: ${weight}`);
      await syncAveWeights();
    } else {
      console.error('Failed to insert average weight:', result.error);
    }
    return result;
  };

  return { handleSendAveWeight, syncAveWeights, fetchAveWeights };
}