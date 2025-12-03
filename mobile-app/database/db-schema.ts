export type FeedLogtype = {
  id: number;
  title: string;
  level: number;
  temp: number;
  date_created: string;
}

export type TempLogType = {
  id: number;
  temperature: number;
  date_created: string;
}

export type AlertLogType = {
  id: number;
  subject: string;
  body: string;
  date_created: string;
}

export type total_fish = {
  id: number;
  count: number;
  date: string;
}

export type ave_weight = {
  id: number;
  weight: number;
  date: string;
}

export const DB_VERSION = 1;

export const schema = {
  feed_logs: `
    CREATE TABLE IF NOT EXISTS feed_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      level TEXT NOT NULL,
      temp TEXT NOT NULL,
      date_created TEXT NOT NULL
    );`,

  temp_logs: `
    CREATE TABLE IF NOT EXISTS temp_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      temperature REAL NOT NULL,
      date_created TEXT NOT NULL
    );`,

  alert_logs: `
    CREATE TABLE IF NOT EXISTS alert_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      date_created TEXT NOT NULL
    );`,

  total_fish: `
    CREATE TABLE IF NOT EXISTS total_fish (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      count INTEGER NOT NULL,
      date TEXT NOT NULL
    );`,

  ave_weight: `
    CREATE TABLE IF NOT EXISTS ave_weight (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      weight REAL NOT NULL,
      date TEXT NOT NULL
    );`

  // Add more tables here as needed
};