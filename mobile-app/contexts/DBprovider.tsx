import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
} from 'react';
import type { FeedLogtype } from '../database/db-schema';
import { initializeDatabase } from '@/database/init-db';
import { resetDatabase } from '@/database/reset-sql';
import type { SQLiteDatabase } from 'expo-sqlite';

if (
  !process.env.EXPO_PUBLIC_TURSO_DB_URL ||
  !process.env.EXPO_PUBLIC_TURSO_DB_AUTH_TOKEN
) {
  throw new Error('Turso DB URL and Auth Token must be set in .env.local');
}

export const DB_NAME = 'feedflow-2';

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

// Export alias for backward compatibility
export const FeedLogsProvider = DatabaseProvider;