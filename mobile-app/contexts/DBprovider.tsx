import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
} from 'react';
import type { FeedLogtype, TempLogType, ave_weight } from '../database/db-schema';
import { initializeDatabase } from '@/database/init-db';
import { resetDatabase } from '@/database/reset-sql';
import type { SQLiteDatabase } from 'expo-sqlite';

if (
  !process.env.EXPO_PUBLIC_TURSO_DB_URL ||
  !process.env.EXPO_PUBLIC_TURSO_DB_AUTH_TOKEN
) {
  throw new Error('Turso DB URL and Auth Token must be set in .env.local');
}

export const DB_NAME = 'feedflow-3';

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

// Export alias for backward compatibility
export const FeedLogsProvider = DatabaseProvider;