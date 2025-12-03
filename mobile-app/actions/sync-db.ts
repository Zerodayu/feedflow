import { useSQLiteContext } from "expo-sqlite";
import { useCallback } from "react";
import type { SQLiteDatabase } from "expo-sqlite";

export async function syncDatabase(db: SQLiteDatabase) {
  try {
    console.log('Syncing database with Turso DB...');
    await db.syncLibSQL();
    console.log('Database synced successfully');
    return { success: true };
  } catch (error) {
    console.error('Failed to sync database:', error);
    return { success: false, error };
  }
}

export function useSyncDatabase() {
  const db = useSQLiteContext();

  const syncToCloud = useCallback(async () => {
    return await syncDatabase(db);
  }, [db]);

  return { syncToCloud };
}