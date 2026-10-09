import Database from "better-sqlite3";
import { app } from "electron";
import { randomUUID } from "node:crypto";
import path from "node:path";

let db;

export function getDb() {
  if (db?.open) {
    return db;
  }

  const dbPath = path.join(
    app.getPath("userData"),
    "notebook.db"
  );

  db = new Database(dbPath);

  db.pragma("foreign_keys = ON");

  db.function("uuid", randomUUID);

  initTables(db);

  return db;
}

function initTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY NOT NULL DEFAULT (uuid()),

      title TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',

      is_pinned INTEGER NOT NULL DEFAULT 0,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      is_archived INTEGER NOT NULL DEFAULT 0,
      is_deleted INTEGER NOT NULL DEFAULT 0,

      cover_type TEXT DEFAULT NULL,
      cover_value TEXT DEFAULT NULL,

      synced INTEGER NOT NULL DEFAULT 0,

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY NOT NULL DEFAULT (uuid()),

      theme TEXT NOT NULL DEFAULT 'dark',
      accent_color TEXT NOT NULL DEFAULT 'blue',
      font_size TEXT NOT NULL DEFAULT 'medium',

      auto_save INTEGER NOT NULL DEFAULT 1,
      spell_check INTEGER NOT NULL DEFAULT 1,
      word_wrap INTEGER NOT NULL DEFAULT 1,

      default_view TEXT NOT NULL DEFAULT 'list',
      backup_folder TEXT DEFAULT NULL,

      synced INTEGER NOT NULL DEFAULT 0,

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migrate existing databases.
  addColumnIfNotExists(
    db,
    "notes",
    "synced",
    "INTEGER NOT NULL DEFAULT 0"
  );

  addColumnIfNotExists(
    db,
    "settings",
    "synced",
    "INTEGER NOT NULL DEFAULT 0"
  );
}

function addColumnIfNotExists(
  db,
  tableName,
  columnName,
  definition
) {
  const columns = db.pragma(`table_info(${tableName})`);

  const columnExists = columns.some(
    (column) => column.name === columnName
  );

  if (!columnExists) {
    db.exec(
      `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`
    );
  }
}

export function closeDb() {
  if (db?.open) {
    db.close();
  }

  db = null;
}