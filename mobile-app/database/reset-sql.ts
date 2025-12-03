import { SQLiteDatabase } from "expo-sqlite";
import { initializeDatabase } from "./init-db";

export async function resetDatabase(db: SQLiteDatabase) {
  console.log("Resetting database...");
  
  // Drop all tables
  await db.execAsync(`DROP TABLE IF EXISTS feed_logs;`);
  
  // Reset version
  await db.execAsync(`PRAGMA user_version = 0;`);
  
  // Reinitialize
  await initializeDatabase(db);
  
  console.log("Database reset complete");
}