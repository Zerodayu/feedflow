import { useSQLiteContext } from "expo-sqlite";
import { useCallback } from "react";
import type { SQLiteDatabase } from "expo-sqlite";
import type { TempLogType } from "../database/db-schema";
import { syncDatabase } from "./sync-db";

const ALERT_COOLDOWN_MS = 60000; // 1 minute cooldown
let lastAlertTime = 0;


async function createTempAlert(db: SQLiteDatabase, temperature: number) {
  const now = Date.now();

  // Check if cooldown period has passed
  if (now - lastAlertTime < ALERT_COOLDOWN_MS) {
    console.log("Alert cooldown active, skipping alert creation");
    return;
  }

  try {
    const subject = "High Temperature Alert";
    const body = `Temperature has reached ${temperature}°C. Please check the system immediately.`;
    const date_created = new Date().toISOString();

    await db.runAsync(
      "INSERT INTO alert_logs (subject, body, date_created) VALUES (?, ?, ?)",
      [subject, body, date_created]
    );

    lastAlertTime = now;
    console.log("Temperature alert created:", { temperature, subject });
  } catch (error) {
    console.error("Failed to create temperature alert:", error);
  }
}

export async function sendTempLog(db: SQLiteDatabase, temperature: number) {
  try {
    await db.runAsync(
      `INSERT INTO temp_logs (temperature, date_created) VALUES (?, ?)`,
      [temperature, new Date().toISOString()]
    );
    console.log("Temperature log inserted successfully:", temperature);

    // Create alert if temperature is 32°C or higher
    if (temperature >= 32) {
      await createTempAlert(db, temperature);
    }

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
      console.log("Fetched temp logs:", logs);
      return logs;
    } catch (error) {
      console.error("Failed to fetch temp logs:", error);
      return [];
    }
  }, [db]);

  const handleSendTempLog = useCallback(async (temperature: number) => {
    const result = await sendTempLog(db, temperature);
    if (result.success) {
      console.log(`Successfully inserted temperature: ${temperature}`);
    } else {
      console.error("Failed to insert temperature log:", result.error);
    }
    return result;
  }, [db]);

  return { handleSendTempLog, fetchTempLogs };
}

export function calculateFeedAmount(biomass: number, temperature: number): number {
  // Feed calculation based on temperature
  // Typical feeding rate: 2-5% of biomass per day
  // Adjust based on temperature (optimal range 28-30°C)
  
  let feedingRate = 0;
  
  if (temperature < 26) {
    feedingRate = 0.02; // 2% - cold, fish eat less
  } else if (temperature >= 26 && temperature < 28) {
    feedingRate = 0.03; // 3%
  } else if (temperature >= 28 && temperature <= 30) {
    feedingRate = 0.04; // 4% - optimal range
  } else if (temperature > 30 && temperature < 32) {
    feedingRate = 0.03; // 3% - getting warm
  } else {
    feedingRate = 0.02; // 2% - too hot, fish stressed
  }
  
  return parseFloat((biomass * feedingRate).toFixed(2));
}