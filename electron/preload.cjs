const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("dbAPI", {
  // Create
  createNote: (note) => ipcRenderer.invoke("create-note", note),

  // Read
  getNotes: () => ipcRenderer.invoke("get-notes"),

  getFavorites: () => ipcRenderer.invoke("get-favorites"),

  getArchived: () => ipcRenderer.invoke("get-archived"),

  getTrash: () => ipcRenderer.invoke("get-trash"),

  getNoteById: (id) => ipcRenderer.invoke("get-note-by-id", id),

  // Update
  updateNote: (note) => ipcRenderer.invoke("update-note", note),

  // Actions
  togglePin: (id) => ipcRenderer.invoke("toggle-pin", id),

  toggleFavorite: (id) => ipcRenderer.invoke("toggle-favorite", id),

  toggleArchive: (id) => ipcRenderer.invoke("toggle-archive", id),

  // Trash
  deleteNote: (id) => ipcRenderer.invoke("delete-note", id),

  restoreNote: (id) => ipcRenderer.invoke("restore-note", id),

  deleteNotePermanently: (id) =>
    ipcRenderer.invoke("delete-note-permanently", id),

  // Search
  searchNotes: (query) => ipcRenderer.invoke("search-notes", query),

  // get all unsynced notes
  getUnsyncedNotes: () => ipcRenderer.invoke("get-all-unsynced-notes"),
  // update all unsynced notes
  updateAllUnsyncedNotes: () => ipcRenderer.invoke("update-all-unsynced-notes"),

  renameNote: (id, title) => ipcRenderer.invoke("rename-note", id, title),
  exportPdf: (html, fileName) =>
    ipcRenderer.invoke("export-pdf", html, fileName),
  setUnsavedChanges: (value) =>
    ipcRenderer.invoke("set-unsaved-changes", value),
  getSettings: () => ipcRenderer.invoke("get-settings"),
  updateSettings: (settings) => ipcRenderer.invoke("update-settings", settings),
  restoreAllNotes: () => ipcRenderer.invoke("restore-all-notes"),
  deleteAllNotes: () => ipcRenderer.invoke("delete-all-notes"),
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
});
