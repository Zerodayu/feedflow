import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
} from 'react';
import type { FeedLogtype, TempLogType, ave_weight, total_fish, AlertLogType, NotesType, ScheduleFeedType } from '../database/db-schema';
import { initializeDatabase } from '@/database/init-db';
import { resetDatabase } from '@/database/reset-sql';
import type { SQLiteDatabase } from 'expo-sqlite';
import { createNote, updateNote, deleteNote } from '@/actions/send-notes';

if (
  !process.env.EXPO_PUBLIC_TURSO_DB_URL ||
  !process.env.EXPO_PUBLIC_TURSO_DB_AUTH_TOKEN
) {
  throw new Error('Turso DB URL and Auth Token must be set in .env.local');
}

export const DB_NAME = 'feedflow-4';

export const tursoOptions = {
  url: process.env.EXPO_PUBLIC_TURSO_DB_URL,
  authToken: process.env.EXPO_PUBLIC_TURSO_DB_AUTH_TOKEN,
};

const RESET_DB = false; // Set to false in production

async function handleDatabaseInit(db: SQLiteDatabase) {
  if (RESET_DB) {
    await resetDatabase(db);
  } else {
    await initializeDatabase(db);
  }
}

interface DatabaseContextType {
  db: SQLiteDatabase;
  syncDatabase: () => Promise<void>;
  toggleAutoSync: (enabled: boolean) => void;
  isSyncing: boolean;
}

const DatabaseContext = createContext<DatabaseContextType | null>(null);

function DatabaseProviderInner({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const [isSyncing, setIsSyncing] = useState(false);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  const syncDatabase = useCallback(async () => {
    console.log('Syncing database with Turso DB...');
    try {
      await db.syncLibSQL();
      console.log('Database synced successfully');
    } catch (e) {
      console.error('Sync failed:', e);
    }
  }, [db]);

  const toggleAutoSync = useCallback(
    async (enabled: boolean) => {
      setIsSyncing(enabled);
      if (enabled) {
        console.log('Starting auto-sync interval...');
        await syncDatabase();
        syncIntervalRef.current = setInterval(syncDatabase, 5000);
      } else if (syncIntervalRef.current) {
        console.log('Stopping auto-sync interval...');
        clearInterval(syncIntervalRef.current);
      }
    },
    [syncDatabase]
  );

  return (
    <DatabaseContext.Provider
      value={{
        db,
        syncDatabase,
        toggleAutoSync,
        isSyncing,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
}

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  return (
    <SQLiteProvider
      databaseName={DB_NAME}
      options={{
        libSQLOptions: tursoOptions
      }}
      onInit={handleDatabaseInit}
    >
      <DatabaseProviderInner>{children}</DatabaseProviderInner>
    </SQLiteProvider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}

// FeedLogs specific hook
interface FeedLogsHook {
  feedLogs: FeedLogtype[];
  createFeedLog: (log: Omit<FeedLogtype, 'id'>) => Promise<FeedLogtype | undefined>;
  updateFeedLog: (id: number, updates: Partial<FeedLogtype>) => Promise<void>;
  deleteFeedLog: (id: number) => Promise<void>;
  refreshFeedLogs: () => Promise<void>;
}

export function useFeedLogs(): FeedLogsHook {
  const { db } = useDatabase();
  const [feedLogs, setFeedLogs] = useState<FeedLogtype[]>([]);

  const fetchFeedLogs = useCallback(async () => {
    try {
      const logs = await db.getAllAsync<FeedLogtype>(
        'SELECT * FROM feed_logs ORDER BY date_created DESC'
      );
      setFeedLogs(logs);
    } catch (error) {
      console.error('Failed to fetch feed logs:', error);
    }
  }, [db]);

  useEffect(() => {
    fetchFeedLogs();
  }, [fetchFeedLogs]);

  const createFeedLog = useCallback(async (log: Omit<FeedLogtype, 'id'>) => {
    try {
      const result = await db.runAsync(
        'INSERT INTO feed_logs (title, level, temp, date_created) VALUES (?, ?, ?, ?)',
        log.title,
        log.level.toString(),
        log.temp.toString(),
        log.date_created
      );
      await fetchFeedLogs();
      return { ...log, id: result.lastInsertRowId };
    } catch (e) {
      console.error('Failed to create feed log:', e);
    }
  }, [db, fetchFeedLogs]);

  const updateFeedLog = useCallback(async (id: number, updates: Partial<FeedLogtype>) => {
    const existingLog = await db.getFirstAsync<FeedLogtype>(
      'SELECT * FROM feed_logs WHERE id = ?',
      [id]
    );

    if (!existingLog) return;

    const updatedLog = {
      title: updates.title ?? existingLog.title,
      level: updates.level ?? existingLog.level,
      temp: updates.temp ?? existingLog.temp,
      date_created: updates.date_created ?? existingLog.date_created,
    };

    await db.runAsync(
      'UPDATE feed_logs SET title = ?, level = ?, temp = ?, date_created = ? WHERE id = ?',
      updatedLog.title,
      updatedLog.level.toString(),
      updatedLog.temp.toString(),
      updatedLog.date_created,
      id
    );
    await fetchFeedLogs();
  }, [db, fetchFeedLogs]);

  const deleteFeedLog = useCallback(async (id: number) => {
    await db.runAsync('DELETE FROM feed_logs WHERE id = ?', id);
    await fetchFeedLogs();
  }, [db, fetchFeedLogs]);

  return {
    feedLogs,
    createFeedLog,
    updateFeedLog,
    deleteFeedLog,
    refreshFeedLogs: fetchFeedLogs,
  };
}

// TempLogs specific hook
interface TempLogsHook {
  tempLogs: TempLogType[];
  createTempLog: (temperature: number) => Promise<TempLogType | undefined>;
  deleteTempLog: (id: number) => Promise<void>;
  refreshTempLogs: () => Promise<void>;
}

export function useTempLogs(): TempLogsHook {
  const { db } = useDatabase();
  const [tempLogs, setTempLogs] = useState<TempLogType[]>([]);

  const fetchTempLogs = useCallback(async () => {
    try {
      const logs = await db.getAllAsync<TempLogType>(
        'SELECT * FROM temp_logs ORDER BY date_created DESC'
      );
      setTempLogs(logs);
    } catch (error) {
      console.error('Failed to fetch temp logs:', error);
    }
  }, [db]);

  useEffect(() => {
    fetchTempLogs();
  }, [fetchTempLogs]);

  const createTempLog = useCallback(async (temperature: number) => {
    try {
      const date_created = new Date().toISOString();
      const result = await db.runAsync(
        'INSERT INTO temp_logs (temperature, date_created) VALUES (?, ?)',
        temperature,
        date_created
      );
      await fetchTempLogs();
      return { 
        id: result.lastInsertRowId, 
        temperature, 
        date_created 
      };
    } catch (e) {
      console.error('Failed to create temp log:', e);
    }
  }, [db, fetchTempLogs]);

  const deleteTempLog = useCallback(async (id: number) => {
    await db.runAsync('DELETE FROM temp_logs WHERE id = ?', id);
    await fetchTempLogs();
  }, [db, fetchTempLogs]);

  return {
    tempLogs,
    createTempLog,
    deleteTempLog,
    refreshTempLogs: fetchTempLogs,
  };
}

// AveWeight specific hook
interface AveWeightHook {
  aveWeights: ave_weight[];
  latestAveWeight: ave_weight | null;
  createAveWeight: (weight: number) => Promise<ave_weight | undefined>;
  deleteAveWeight: (id: number) => Promise<void>;
  refreshAveWeights: () => Promise<void>;
}

export function useAveWeight(): AveWeightHook {
  const { db } = useDatabase();
  const [aveWeights, setAveWeights] = useState<ave_weight[]>([]);
  const [latestAveWeight, setLatestAveWeight] = useState<ave_weight | null>(null);

  const fetchAveWeights = useCallback(async () => {
    try {
      const weights = await db.getAllAsync<ave_weight>(
        'SELECT * FROM ave_weight ORDER BY date DESC'
      );
      setAveWeights(weights);
      setLatestAveWeight(weights[0] || null);
    } catch (error) {
      console.error('Failed to fetch average weights:', error);
    }
  }, [db]);

  useEffect(() => {
    fetchAveWeights();
  }, [fetchAveWeights]);

  const createAveWeight = useCallback(async (weight: number) => {
    try {
      const date = new Date().toISOString();
      const result = await db.runAsync(
        'INSERT INTO ave_weight (weight, date) VALUES (?, ?)',
        weight,
        date
      );
      await fetchAveWeights();
      return { 
        id: result.lastInsertRowId, 
        weight, 
        date 
      };
    } catch (e) {
      console.error('Failed to create average weight:', e);
    }
  }, [db, fetchAveWeights]);

  const deleteAveWeight = useCallback(async (id: number) => {
    await db.runAsync('DELETE FROM ave_weight WHERE id = ?', id);
    await fetchAveWeights();
  }, [db, fetchAveWeights]);

  return {
    aveWeights,
    latestAveWeight,
    createAveWeight,
    deleteAveWeight,
    refreshAveWeights: fetchAveWeights,
  };
}

// FishCount specific hook
interface FishCountHook {
  fishCounts: total_fish[];
  latestFishCount: total_fish | null;
  createFishCount: (count: number) => Promise<total_fish | undefined>;
  deleteFishCount: (id: number) => Promise<void>;
  refreshFishCounts: () => Promise<void>;
}

export function useFishCount(): FishCountHook {
  const { db } = useDatabase();
  const [fishCounts, setFishCounts] = useState<total_fish[]>([]);
  const [latestFishCount, setLatestFishCount] = useState<total_fish | null>(null);

  const fetchFishCounts = useCallback(async () => {
    try {
      const counts = await db.getAllAsync<total_fish>(
        'SELECT * FROM total_fish ORDER BY date DESC'
      );
      setFishCounts(counts);
      setLatestFishCount(counts[0] || null);
    } catch (error) {
      console.error('Failed to fetch fish counts:', error);
    }
  }, [db]);

  useEffect(() => {
    fetchFishCounts();
  }, [fetchFishCounts]);

  const createFishCount = useCallback(async (count: number) => {
    try {
      const date = new Date().toISOString();
      const result = await db.runAsync(
        'INSERT INTO total_fish (count, date) VALUES (?, ?)',
        count,
        date
      );
      await fetchFishCounts();
      return { 
        id: result.lastInsertRowId, 
        count, 
        date 
      };
    } catch (e) {
      console.error('Failed to create fish count:', e);
    }
  }, [db, fetchFishCounts]);

  const deleteFishCount = useCallback(async (id: number) => {
    await db.runAsync('DELETE FROM total_fish WHERE id = ?', id);
    await fetchFishCounts();
  }, [db, fetchFishCounts]);

  return {
    fishCounts,
    latestFishCount,
    createFishCount,
    deleteFishCount,
    refreshFishCounts: fetchFishCounts,
  };
}

// AlertLogs specific hook
interface AlertLogsHook {
  alertLogs: AlertLogType[];
  createAlert: (temperature: number, weight: number) => Promise<AlertLogType | undefined>;
  deleteAlert: (id: number) => Promise<void>;
  refreshAlerts: () => Promise<void>;
}

export function useAlertLogs(): AlertLogsHook {
  const { db } = useDatabase();
  const [alertLogs, setAlertLogs] = useState<AlertLogType[]>([]);

  const fetchAlerts = useCallback(async () => {
    try {
      const alerts = await db.getAllAsync<AlertLogType>(
        'SELECT * FROM alert_logs ORDER BY date_created DESC'
      );
      setAlertLogs(alerts);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  }, [db]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const createAlert = useCallback(
    async (temperature: number, weight: number) => {
      try {
        const highTemp = temperature >= 32;
        const lowFeed = weight <= 10;

        if (!highTemp && !lowFeed) {
          return undefined;
        }

        const subject =
          highTemp && !lowFeed
            ? "High Temperature"
            : !highTemp && lowFeed
            ? "Low Feed Level"
            : "High Temperature & Low Feed Level";

        const body =
          highTemp && !lowFeed
            ? `Temperature has reached ${temperature}°C. Please check the system immediately.`
            : !highTemp && lowFeed
            ? `Feed level is critically low at ${weight}kg. Please refill soon.`
            : `CRITICAL: Temperature at ${temperature}°C and feed level at ${weight}kg. Immediate action required.`;

        const date_created = new Date().toISOString();

        const result = await db.runAsync(
          'INSERT INTO alert_logs (subject, body, date_created) VALUES (?, ?, ?)',
          subject,
          body,
          date_created
        );
        await fetchAlerts();
        return {
          id: result.lastInsertRowId,
          subject,
          body,
          date_created,
        };
      } catch (e) {
        console.error('Failed to create alert:', e);
      }
    },
    [db, fetchAlerts]
  );

  const deleteAlert = useCallback(
    async (id: number) => {
      await db.runAsync('DELETE FROM alert_logs WHERE id = ?', id);
      await fetchAlerts();
    },
    [db, fetchAlerts]
  );

  return {
    alertLogs,
    createAlert,
    deleteAlert,
    refreshAlerts: fetchAlerts,
  };
}

// Notes specific hook
interface NotesHook {
  notes: NotesType[];
  createNote: (note: Omit<NotesType, 'id' | 'date_created'>) => Promise<NotesType | undefined>;
  updateNote: (id: number, updates: Partial<Omit<NotesType, 'id' | 'date_created'>>) => Promise<void>;
  deleteNote: (id: number) => Promise<void>;
  refreshNotes: () => Promise<void>;
}

export function useNotes(): NotesHook {
  const { db } = useDatabase();
  const [notes, setNotes] = useState<NotesType[]>([]);

  const fetchNotes = useCallback(async () => {
    try {
      const notesList = await db.getAllAsync<NotesType>(
        'SELECT * FROM notes ORDER BY date_created DESC'
      );
      setNotes(notesList);
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    }
  }, [db]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleCreateNote = useCallback(async (note: Omit<NotesType, 'id' | 'date_created'>) => {
    try {
      const result = await createNote(db, note);
      if (result.success && result.id) {
        await fetchNotes();
        return { 
          ...note, 
          id: result.id,
          date_created: new Date().toISOString()
        } as NotesType;
      }
    } catch (e) {
      console.error('Failed to create note:', e);
    }
    return undefined;
  }, [db, fetchNotes]);

  const handleUpdateNote = useCallback(async (id: number, updates: Partial<Omit<NotesType, 'id' | 'date_created'>>) => {
    try {
      const result = await updateNote(db, id, updates);
      if (result.success) {
        await fetchNotes();
      }
    } catch (e) {
      console.error('Failed to update note:', e);
    }
  }, [db, fetchNotes]);

  const handleDeleteNote = useCallback(async (id: number) => {
    try {
      const result = await deleteNote(db, id);
      if (result.success) {
        await fetchNotes();
      }
    } catch (e) {
      console.error('Failed to delete note:', e);
    }
  }, [db, fetchNotes]);

  return {
    notes,
    createNote: handleCreateNote,
    updateNote: handleUpdateNote,
    deleteNote: handleDeleteNote,
    refreshNotes: fetchNotes,
  };
}

// ScheduleFeeds specific hook
interface ScheduleFeedsHook {
  scheduleFeeds: ScheduleFeedType[];
  createScheduleFeed: (scheduleFeed: Omit<ScheduleFeedType, 'id'>) => Promise<ScheduleFeedType | undefined>;
  updateScheduleFeed: (id: number, updates: Partial<Omit<ScheduleFeedType, 'id'>>) => Promise<void>;
  deleteScheduleFeed: (id: number) => Promise<void>;
  refreshScheduleFeeds: () => Promise<void>;
}

export function useScheduleFeeds(): ScheduleFeedsHook {
  const { db } = useDatabase();
  const [scheduleFeeds, setScheduleFeeds] = useState<ScheduleFeedType[]>([]);

  const fetchScheduleFeeds = useCallback(async () => {
    try {
      const scheduleFeedsList = await db.getAllAsync<ScheduleFeedType>(
        'SELECT * FROM schedule_feeds ORDER BY time ASC'
      );
      setScheduleFeeds(scheduleFeedsList);
    } catch (error) {
      console.error('Failed to fetch schedule feeds:', error);
    }
  }, [db]);

  useEffect(() => {
    fetchScheduleFeeds();
  }, [fetchScheduleFeeds]);

  const handleCreateScheduleFeed = useCallback(async (scheduleFeed: Omit<ScheduleFeedType, 'id'>) => {
    try {
      const result = await db.runAsync(
        'INSERT INTO schedule_feeds (kg, time) VALUES (?, ?)',
        scheduleFeed.kg,
        scheduleFeed.time
      );
      await fetchScheduleFeeds();
      return { 
        ...scheduleFeed, 
        id: result.lastInsertRowId
      } as ScheduleFeedType;
    } catch (e) {
      console.error('Failed to create schedule feed:', e);
    }
    return undefined;
  }, [db, fetchScheduleFeeds]);

  const handleUpdateScheduleFeed = useCallback(async (id: number, updates: Partial<Omit<ScheduleFeedType, 'id'>>) => {
    try {
      const existingScheduleFeed = await db.getFirstAsync<ScheduleFeedType>(
        'SELECT * FROM schedule_feeds WHERE id = ?',
        [id]
      );

      if (!existingScheduleFeed) return;

      const updatedScheduleFeed = {
        kg: updates.kg ?? existingScheduleFeed.kg,
        time: updates.time ?? existingScheduleFeed.time,
      };

      await db.runAsync(
        'UPDATE schedule_feeds SET kg = ?, time = ? WHERE id = ?',
        updatedScheduleFeed.kg,
        updatedScheduleFeed.time,
        id
      );
      await fetchScheduleFeeds();
    } catch (e) {
      console.error('Failed to update schedule feed:', e);
    }
  }, [db, fetchScheduleFeeds]);

  const handleDeleteScheduleFeed = useCallback(async (id: number) => {
    try {
      await db.runAsync('DELETE FROM schedule_feeds WHERE id = ?', id);
      await fetchScheduleFeeds();
    } catch (e) {
      console.error('Failed to delete schedule feed:', e);
    }
  }, [db, fetchScheduleFeeds]);

  return {
    scheduleFeeds,
    createScheduleFeed: handleCreateScheduleFeed,
    updateScheduleFeed: handleUpdateScheduleFeed,
    deleteScheduleFeed: handleDeleteScheduleFeed,
    refreshScheduleFeeds: fetchScheduleFeeds,
  };
}

// Export alias for backward compatibility
export const FeedLogsProvider = DatabaseProvider;