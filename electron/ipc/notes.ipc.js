import { ipcMain } from "electron";
import { getDb } from "../db.js";

export function registerNoteHandlers() {
  const db = getDb();

  /* ── CREATE ─────────────────────────────────────────────────────────────── */
  ipcMain.handle("create-note", (_, note) => {
    const result = db
      .prepare(
        `
      INSERT INTO notes (title, content, cover_type, cover_value)
      VALUES (?, ?, ?, ?)
    `,
      )
      .run(
        note?.title ?? "Untitled",
        note?.content ?? "",
        note?.cover_type ?? null,
        note?.cover_value ?? null,
      );
    return { success: true, id: result.lastInsertRowid, result };
  });

  /* ── GET ALL ─────────────────────────────────────────────────────────────── */
  ipcMain.handle("get-notes", () => {
    return db
      .prepare(
        `
      SELECT * FROM notes
      WHERE is_deleted = 0 AND is_archived = 0
      ORDER BY is_pinned DESC, updated_at DESC, id DESC
    `,
      )
      .all();
  });

  /* ── GET FAVORITES ───────────────────────────────────────────────────────── */
  ipcMain.handle("get-favorites", () => {
    return db
      .prepare(
        `
      SELECT * FROM notes
      WHERE is_deleted = 0 AND is_favorite = 1
      ORDER BY is_pinned DESC, updated_at DESC
    `,
      )
      .all();
  });

  /* ── GET ARCHIVED ────────────────────────────────────────────────────────── */
  ipcMain.handle("get-archived", () => {
    return db
      .prepare(
        `
      SELECT * FROM notes
      WHERE is_archived = 1 AND is_deleted = 0
      ORDER BY updated_at DESC
    `,
      )
      .all();
  });

  /* ── GET TRASH ───────────────────────────────────────────────────────────── */
  ipcMain.handle("get-trash", () => {
    return db
      .prepare(
        `
      SELECT * FROM notes
      WHERE is_deleted = 1
      ORDER BY deleted_at DESC
    `,
      )
      .all();
  });

  /* ── GET BY ID ───────────────────────────────────────────────────────────── */
  ipcMain.handle("get-note-by-id", (_, id) => {
    return db.prepare(`SELECT * FROM notes WHERE id = ?`).get(id);
  });

  /* ── GET ALL UNSYNCED NOTES ──────────────────────────────────────────────────────────────── */
  ipcMain.handle("get-all-unsynced-notes", () => {
    return db.prepare(`SELECT * FROM notes WHERE synced = 0`).all();
  });

  /* ── UPDATE ALL UNSYNCED NOTES ──────────────────────────────────────────────────────────────── */
  ipcMain.handle("update-all-unsynced-notes", (_, ids = []) => {
    return ids.map((e) =>
      db.prepare(`UPDATE notes SET synced = 1 WHERE id = ?`).run(e),
    );
  });

  /* ── UPDATE ──────────────────────────────────────────────────────────────── */
  ipcMain.handle("update-note", (_, note) => {
    const result = db
      .prepare(
        `
      UPDATE notes
      SET title = ?, content = ?, cover_type = ?, cover_value = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      )
      .run(
        note.title,
        note.content,
        note.cover_type,
        note.cover_value,
        note.id,
      );
    return { success: true, changes: result.changes, result };
  });

  /* ── RENAME ──────────────────────────────────────────────────────────────── */
  ipcMain.handle("rename-note", (_, id, title) => {
    const result = db
      .prepare(
        `
      UPDATE notes SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `,
      )
      .run(title, id);
    return { success: true, changes: result.changes };
  });

  /* ── TOGGLE PIN ──────────────────────────────────────────────────────────── */
  ipcMain.handle("toggle-pin", (_, id) => {
    return db
      .prepare(
        `
      UPDATE notes
      SET is_pinned = CASE WHEN is_pinned = 1 THEN 0 ELSE 1 END, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      )
      .run(id);
  });

  /* ── TOGGLE FAVORITE ─────────────────────────────────────────────────────── */
  ipcMain.handle("toggle-favorite", (_, id) => {
    return db
      .prepare(
        `
      UPDATE notes
      SET is_favorite = CASE WHEN is_favorite = 1 THEN 0 ELSE 1 END, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      )
      .run(id);
  });

  /* ── TOGGLE ARCHIVE ──────────────────────────────────────────────────────── */
  ipcMain.handle("toggle-archive", (_, id) => {
    return db
      .prepare(
        `
      UPDATE notes
      SET is_archived = CASE WHEN is_archived = 1 THEN 0 ELSE 1 END, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      )
      .run(id);
  });

  /* ── SOFT DELETE ─────────────────────────────────────────────────────────── */
  ipcMain.handle("delete-note", (_, id) => {
    return db
      .prepare(
        `
      UPDATE notes SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?
    `,
      )
      .run(id);
  });

  /* ── RESTORE ─────────────────────────────────────────────────────────────── */
  ipcMain.handle("restore-note", (_, id) => {
    return db
      .prepare(
        `
      UPDATE notes SET is_deleted = 0, deleted_at = NULL WHERE id = ?
    `,
      )
      .run(id);
  });
  // Restore All Notes
  ipcMain.handle("restore-all-notes", () => {
    return db
      .prepare(
        `
      UPDATE notes SET is_deleted = 0, deleted_at = NULL
    `,
      )
      .run();
  });

  /* ── DELETE PERMANENTLY ──────────────────────────────────────────────────── */
  ipcMain.handle("delete-note-permanently", (_, id) => {
    return db.prepare(`DELETE FROM notes WHERE id = ?`).run(id);
  });
  // Delete All Notes
  ipcMain.handle("delete-all-notes", () => {
    return db.prepare(`DELETE FROM notes WHERE is_deleted = 1`).run();
  });
}
