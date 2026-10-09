export const cloudSync = async () => {
  const notes = await window.dbAPI.getUnsyncedNotes();

  console.log("All notes:", notes);

  if (!notes.length) {
    return { message: "No notes to sync" };
  }

  const normalizedNotes = notes.map((note) => ({
    ...note,

    // SQLite: 0/1 → JavaScript boolean
    is_pinned: Boolean(note.is_pinned),
    is_favorite: Boolean(note.is_favorite),
    is_archived: Boolean(note.is_archived),
    is_deleted: Boolean(note.is_deleted),

    // Nullable cover fields
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
    throw new Error(
      result.message || JSON.stringify(result)
    );
  }

  const noteIds = notes.map((note) => note.id);

  await window.dbAPI.updateAllUnsyncedNotes(noteIds);

  return result;
};