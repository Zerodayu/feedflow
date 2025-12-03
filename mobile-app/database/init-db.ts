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
    console.log("Database is up to date.", currentDbVersion);
    return;
  }

  if (currentDbVersion === 0) {
    await db.execAsync(schema.feeds);
    currentDbVersion = 1;
  } else {
    console.log("DB Version:", currentDbVersion);
  }

  await db.execAsync(`PRAGMA user_version = ${DB_VERSION};`);
  console.log("Database migrated successfully");
}