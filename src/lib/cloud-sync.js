
export const cloudSync = async (onStatusChange = () => {}) => {
  try {
    const notes = await window.dbAPI.getUnsyncedNotes();

    if (!notes.length) {
      onStatusChange("Synced");
      return { message: "No notes to sync", status: "Synced" };
    }

    const syncingStatus = `Syncing... ${notes.length} notes`;
    onStatusChange(syncingStatus);

    const normalizedNotes = notes.map((note) => ({
      ...note,
      is_pinned: Boolean(note.is_pinned),
      is_favorite: Boolean(note.is_favorite),
      is_archived: Boolean(note.is_archived),
      is_deleted: Boolean(note.is_deleted),
      cover_type: note.cover_type ?? null,
      cover_value: note.cover_value ?? null,
    }));

    const response = await fetch(
      "http://localhost:9000/api/notes/create-note",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(normalizedNotes),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Sync failed");
    }

    const noteIds = notes.map((note) => note.id);

    await window.dbAPI.updateAllUnsyncedNotes(noteIds);

    onStatusChange("Synced");

    return { ...result, status: "Synced" };
  } catch (error) {
    onStatusChange("Sync failed");
    throw error;
  }
};
