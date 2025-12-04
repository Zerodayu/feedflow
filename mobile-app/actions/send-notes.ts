import { useSQLiteContext } from "expo-sqlite";
import { useCallback } from "react";
import type { SQLiteDatabase } from "expo-sqlite";
import type { NotesType } from "../database/db-schema";
import { syncDatabase } from "./sync-db";

export async function createNote(
  db: SQLiteDatabase,
  note: Omit<NotesType, 'id' | 'date_created'>
) {
  const noteData: Omit<NotesType, "id"> = {
    ...note,
    date_created: new Date().toISOString(),
  };

  try {
    const result = await db.runAsync(
      `INSERT INTO notes (title, fish_count, temperature, observation, date_created) VALUES (?, ?, ?, ?, ?)`,
      [
        noteData.title,
        noteData.fish_count,
        noteData.temperature,
        noteData.observation,
        noteData.date_created
      ]
    );
    console.log("Note inserted successfully");

    // Sync to cloud after inserting
    await syncDatabase(db);

    return { success: true, id: result.lastInsertRowId };
  } catch (error) {
    console.error("Failed to insert note:", error);
    return { success: false, error };
  }
}

export async function updateNote(
  db: SQLiteDatabase,
  id: number,
  updates: Partial<Omit<NotesType, 'id' | 'date_created'>>
) {
  try {
    const existingNote = await db.getFirstAsync<NotesType>(
      'SELECT * FROM notes WHERE id = ?',
      [id]
    );

    if (!existingNote) {
      return { success: false, error: 'Note not found' };
    }

    const updatedNote = {
      title: updates.title ?? existingNote.title,
      fish_count: updates.fish_count ?? existingNote.fish_count,
      temperature: updates.temperature ?? existingNote.temperature,
      observation: updates.observation ?? existingNote.observation,
    };

    await db.runAsync(
      `UPDATE notes SET title = ?, fish_count = ?, temperature = ?, observation = ? WHERE id = ?`,
      [
        updatedNote.title,
        updatedNote.fish_count,
        updatedNote.temperature,
        updatedNote.observation,
        id
      ]
    );
    console.log("Note updated successfully");

    // Sync to cloud after updating
    await syncDatabase(db);

    return { success: true };
  } catch (error) {
    console.error("Failed to update note:", error);
    return { success: false, error };
  }
}

export async function deleteNote(db: SQLiteDatabase, id: number) {
  try {
    await db.runAsync('DELETE FROM notes WHERE id = ?', [id]);
    console.log("Note deleted successfully");

    // Sync to cloud after deleting
    await syncDatabase(db);

    return { success: true };
  } catch (error) {
    console.error("Failed to delete note:", error);
    return { success: false, error };
  }
}

export function useSendNotes() {
  const db = useSQLiteContext();

  const fetchNotes = useCallback(async () => {
    try {
      const notes = await db.getAllAsync<NotesType>(
        'SELECT * FROM notes ORDER BY date_created DESC'
      );
      console.log('Fetched notes:', notes);
      return notes;
    } catch (error) {
      console.error('Failed to fetch notes:', error);
      return [];
    }
  }, [db]);

  const fetchNoteById = useCallback(async (id: number) => {
    try {
      const note = await db.getFirstAsync<NotesType>(
        'SELECT * FROM notes WHERE id = ?',
        [id]
      );
      console.log('Fetched note:', note);
      return note;
    } catch (error) {
      console.error('Failed to fetch note:', error);
      return null;
    }
  }, [db]);

  const syncNotes = useCallback(async () => {
    console.log('Syncing notes with Turso DB...');

    try {
      await syncDatabase(db);
      await fetchNotes();
      console.log('Synced notes with Turso DB');
    } catch (e) {
      console.log(e);
    }
  }, [db, fetchNotes]);

  const handleCreateNote = async (note: Omit<NotesType, 'id' | 'date_created'>) => {
    const result = await createNote(db, note);
    if (result.success) {
      console.log(`Successfully inserted note: ${note.title}`);
      await syncNotes();
    } else {
      console.error('Failed to insert note:', result.error);
    }
    return result;
  };

  const handleUpdateNote = async (
    id: number,
    updates: Partial<Omit<NotesType, 'id' | 'date_created'>>
  ) => {
    const result = await updateNote(db, id, updates);
    if (result.success) {
      console.log(`Successfully updated note with ID: ${id}`);
      await syncNotes();
    } else {
      console.error('Failed to update note:', result.error);
    }
    return result;
  };

  const handleDeleteNote = async (id: number) => {
    const result = await deleteNote(db, id);
    if (result.success) {
      console.log(`Successfully deleted note with ID: ${id}`);
      await syncNotes();
    } else {
      console.error('Failed to delete note:', result.error);
    }
    return result;
  };

  return {
    handleCreateNote,
    handleUpdateNote,
    handleDeleteNote,
    syncNotes,
    fetchNotes,
    fetchNoteById,
  };
}