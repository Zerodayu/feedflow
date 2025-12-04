import { useSQLiteContext } from "expo-sqlite";
import { useCallback } from "react";
import type { SQLiteDatabase } from "expo-sqlite";
import type { ScheduleFeedType } from "../database/db-schema";
import { syncDatabase } from "./sync-db";

export async function createScheduleFeed(
  db: SQLiteDatabase,
  scheduleFeed: Omit<ScheduleFeedType, 'id'>
) {
  try {
    const result = await db.runAsync(
      `INSERT INTO schedule_feeds (kg, time) VALUES (?, ?)`,
      [
        scheduleFeed.kg,
        scheduleFeed.time
      ]
    );
    console.log("Schedule feed inserted successfully");

    // Sync to cloud after inserting
    await syncDatabase(db);

    return { success: true, id: result.lastInsertRowId };
  } catch (error) {
    console.error("Failed to insert schedule feed:", error);
    return { success: false, error };
  }
}

export async function updateScheduleFeed(
  db: SQLiteDatabase,
  id: number,
  updates: Partial<Omit<ScheduleFeedType, 'id'>>
) {
  try {
    const existingScheduleFeed = await db.getFirstAsync<ScheduleFeedType>(
      'SELECT * FROM schedule_feeds WHERE id = ?',
      [id]
    );

    if (!existingScheduleFeed) {
      return { success: false, error: 'Schedule feed not found' };
    }

    const updatedScheduleFeed = {
      kg: updates.kg ?? existingScheduleFeed.kg,
      time: updates.time ?? existingScheduleFeed.time,
    };

    await db.runAsync(
      `UPDATE schedule_feeds SET kg = ?, time = ? WHERE id = ?`,
      [
        updatedScheduleFeed.kg,
        updatedScheduleFeed.time,
        id
      ]
    );
    console.log("Schedule feed updated successfully");

    // Sync to cloud after updating
    await syncDatabase(db);

    return { success: true };
  } catch (error) {
    console.error("Failed to update schedule feed:", error);
    return { success: false, error };
  }
}

export async function deleteScheduleFeed(db: SQLiteDatabase, id: number) {
  try {
    await db.runAsync('DELETE FROM schedule_feeds WHERE id = ?', [id]);
    console.log("Schedule feed deleted successfully");

    // Sync to cloud after deleting
    await syncDatabase(db);

    return { success: true };
  } catch (error) {
    console.error("Failed to delete schedule feed:", error);
    return { success: false, error };
  }
}

export function useSendScheduleFeeds() {
  const db = useSQLiteContext();

  const fetchScheduleFeeds = useCallback(async () => {
    try {
      const scheduleFeeds = await db.getAllAsync<ScheduleFeedType>(
        'SELECT * FROM schedule_feeds ORDER BY time ASC'
      );
      console.log('Fetched schedule feeds:', scheduleFeeds);
      return scheduleFeeds;
    } catch (error) {
      console.error('Failed to fetch schedule feeds:', error);
      return [];
    }
  }, [db]);

  const fetchScheduleFeedById = useCallback(async (id: number) => {
    try {
      const scheduleFeed = await db.getFirstAsync<ScheduleFeedType>(
        'SELECT * FROM schedule_feeds WHERE id = ?',
        [id]
      );
      console.log('Fetched schedule feed:', scheduleFeed);
      return scheduleFeed;
    } catch (error) {
      console.error('Failed to fetch schedule feed:', error);
      return null;
    }
  }, [db]);

  const syncScheduleFeeds = useCallback(async () => {
    console.log('Syncing schedule feeds with Turso DB...');

    try {
      await syncDatabase(db);
      await fetchScheduleFeeds();
      console.log('Synced schedule feeds with Turso DB');
    } catch (e) {
      console.log(e);
    }
  }, [db, fetchScheduleFeeds]);

  const handleCreateScheduleFeed = async (scheduleFeed: Omit<ScheduleFeedType, 'id'>) => {
    const result = await createScheduleFeed(db, scheduleFeed);
    if (result.success) {
      console.log(`Successfully inserted schedule feed: ${scheduleFeed.time}`);
      await syncScheduleFeeds();
    } else {
      console.error('Failed to insert schedule feed:', result.error);
    }
    return result;
  };

  const handleUpdateScheduleFeed = async (
    id: number,
    updates: Partial<Omit<ScheduleFeedType, 'id'>>
  ) => {
    const result = await updateScheduleFeed(db, id, updates);
    if (result.success) {
      console.log(`Successfully updated schedule feed with ID: ${id}`);
      await syncScheduleFeeds();
    } else {
      console.error('Failed to update schedule feed:', result.error);
    }
    return result;
  };

  const handleDeleteScheduleFeed = async (id: number) => {
    const result = await deleteScheduleFeed(db, id);
    if (result.success) {
      console.log(`Successfully deleted schedule feed with ID: ${id}`);
      await syncScheduleFeeds();
    } else {
      console.error('Failed to delete schedule feed:', result.error);
    }
    return result;
  };

  return {
    handleCreateScheduleFeed,
    handleUpdateScheduleFeed,
    handleDeleteScheduleFeed,
    syncScheduleFeeds,
    fetchScheduleFeeds,
    fetchScheduleFeedById,
  };
}