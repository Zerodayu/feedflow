import { SQLiteDatabase } from "expo-sqlite";
import { schema, DB_VERSION } from "./db-schema";

export async function initializeDatabase(db: SQLiteDatabase) {
  try {
    await db.syncLibSQL();
  } catch (error) {
    console.error("Failed to sync LibSQL:", error);
  }

  const result = await db.getFirstAsync<{ user_version: number } | null>(
    `PRAGMA user_version;`
  );
  let currentDbVersion = result?.user_version ?? 0;

  if (currentDbVersion >= DB_VERSION) {
    console.log("Database is up to date. VERSION: ", currentDbVersion);
    return;
  }

  if (currentDbVersion === 0) {
    // Create all tables
    await db.execAsync(schema.feed_logs);
    await db.execAsync(schema.temp_logs);
    await db.execAsync(schema.alert_logs);
    await db.execAsync(schema.total_fish);
    await db.execAsync(schema.ave_weight);
    console.log("Database initialized successfully");
    await db.execAsync(`PRAGMA user_version = ${DB_VERSION};`);
  } else {
    // Handle migrations for future versions
    console.log("Running migrations from version:", currentDbVersion);
    // Add migration logic here when needed
  }

  console.log("Database setup complete");
}