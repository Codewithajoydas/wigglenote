import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import createNote from "../services/notebook/createNote.services";
import updateNote from "../services/notebook/updateNote.services";

import { SettingsContext } from "../store/Settings.context";
import { toast } from "@/components/ui/toast";

const AUTO_TITLE_MAX_LEN = 80;

function extractAutoTitle(editorText = "") {
  const firstLine =
    editorText
      .split(/\r?\n/)
      .find((line) => line.trim())
      ?.trim() || "";

  if (!firstLine) {
    return "Untitled Note";
  }

  if (firstLine.length <= AUTO_TITLE_MAX_LEN) {
    return firstLine;
  }

  const truncated = firstLine.slice(0, AUTO_TITLE_MAX_LEN);
  const lastSpace = truncated.lastIndexOf(" ");

  const base =
    lastSpace > 0
      ? truncated.slice(0, lastSpace)
      : truncated;

  return `${base}…`;
}

function normalizeTitle(title, editorText) {
  const normalizedTitle = title?.trim() || "";

  if (
    !normalizedTitle ||
    normalizedTitle === "Untitled Note"
  ) {
    return extractAutoTitle(editorText);
  }

  return normalizedTitle;
}

function areCoversEqual(first, second) {
  return (
    (first?.type ?? null) === (second?.type ?? null) &&
    (first?.value ?? null) === (second?.value ?? null)
  );
}

export default function useNotebookCRUD({
  editor,
  noteId,
  title,
  cover,
  setNoteId,
  setSaved,
  debounceMs = 1000,
}) {
  const { settings } = useContext(SettingsContext);

  const [title_a, setTitle] = useState(title);

  const noteIdRef = useRef(noteId);
  const titleRef = useRef(title);
  const saveTimeoutRef = useRef(null);

  const isCreatingRef = useRef(false);
  const isSavingRef = useRef(false);
  const saveQueuedRef = useRef(false);
  const editVersionRef = useRef(0);

  const isAutoSaveOn = Number(settings.auto_save) === 1;

  useEffect(() => {
    noteIdRef.current = noteId;
  }, [noteId]);

  useEffect(() => {
    titleRef.current = title;
    setTitle(title);
  }, [title]);

  const buildPayload = useCallback(
    (id = null) => {
      if (!editor) {
        throw new Error("Editor is not available.");
      }

      const editorText = editor.getText();

      return {
        ...(id ? { id } : {}),
        title: normalizeTitle(title, editorText),
        content: JSON.stringify(editor.getJSON()),
        cover_type: cover?.type ?? null,
        cover_value: cover?.value ?? null,
        synced: 0,
      };
    },
    [editor, title, cover]
  );

  const dispatchNoteUpdated = useCallback(() => {
    window.dispatchEvent(new CustomEvent("note-updated"));
  }, []);

  const clearSaveTimeout = useCallback(() => {
    if (saveTimeoutRef.current !== null) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  }, []);

  const create = useCallback(async () => {
    if (!editor || noteIdRef.current || isCreatingRef.current) {
      return;
    }

    if (editor.isEmpty) {
      toast.add({
        type: "error",
        title: "Error",
        description: "Note is empty.",
      });

      return;
    }

    isCreatingRef.current = true;
    clearSaveTimeout();

    const currentVersion = editVersionRef.current;

    try {
      const result = await createNote(buildPayload());

      if (!result?.id) {
        throw new Error("Note creation returned no ID.");
      }

      noteIdRef.current = result.id;
      setNoteId(result.id);

      setSaved(editVersionRef.current === currentVersion);

      dispatchNoteUpdated();

      toast.add({
        type: "success",
        title: "Saved",
        description: "Note created successfully.",
      });
    } catch (error) {
      console.error("Failed to create note:", error);

      toast.add({
        type: "error",
        title: "Error",
        description: "Failed to create note.",
      });
    } finally {
      isCreatingRef.current = false;
    }
  }, [
    editor,
    buildPayload,
    setNoteId,
    setSaved,
    clearSaveTimeout,
    dispatchNoteUpdated,
  ]);

  const save = useCallback(
    async (options = {}) => {
      const { showSuccess = true } = options;
      const id = noteIdRef.current;

      if (!editor || !id) {
        return;
      }

      if (isSavingRef.current) {
        saveQueuedRef.current = true;
        return;
      }

      isSavingRef.current = true;

      let savedVersion = editVersionRef.current;

      try {
        do {
          saveQueuedRef.current = false;

          const currentVersion = editVersionRef.current;
          const payload = buildPayload(id);

          await updateNote(payload);

          savedVersion = currentVersion;
        } while (saveQueuedRef.current);

        const isFullySaved =
          savedVersion === editVersionRef.current;

        setSaved(isFullySaved);

        dispatchNoteUpdated();

        if (showSuccess && isFullySaved) {
          toast.add({
            type: "success",
            title: "Saved",
            description: "Note saved successfully.",
          });
        }
      } catch (error) {
        console.error("Failed to save note:", error);

        setSaved(false);

        toast.add({
          type: "error",
          title: "Error",
          description: "Failed to save note.",
        });
      } finally {
        isSavingRef.current = false;
      }
    },
    [
      editor,
      buildPayload,
      setSaved,
      dispatchNoteUpdated,
    ]
  );

  const debouncedSave = useCallback(() => {
    clearSaveTimeout();

    saveTimeoutRef.current = setTimeout(() => {
      saveTimeoutRef.current = null;
      void save({ showSuccess: false });
    }, Math.max(0, debounceMs));
  }, [save, debounceMs, clearSaveTimeout]);

  const auto_detect_title = useCallback(() => {
    if (!editor) {
      return;
    }

    const currentTitle = titleRef.current?.trim() || "";

    if (
      currentTitle &&
      currentTitle !== "Untitled Note"
    ) {
      return;
    }

    setTitle(extractAutoTitle(editor.getText()));
  }, [editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const onUpdate = () => {
      editVersionRef.current += 1;

      setSaved(false);

      auto_detect_title();

      if (noteIdRef.current && isAutoSaveOn) {
        debouncedSave();
      }
    };

    editor.on("update", onUpdate);

    return () => {
      editor.off("update", onUpdate);
    };
  }, [
    editor,
    isAutoSaveOn,
    debouncedSave,
    auto_detect_title,
    setSaved,
  ]);

  const previousMetaRef = useRef({
    noteId,
    title,
    coverType: cover?.type ?? null,
    coverValue: cover?.value ?? null,
  });

  useEffect(() => {
    const previous = previousMetaRef.current;

    previousMetaRef.current = {
      noteId,
      title,
      coverType: cover?.type ?? null,
      coverValue: cover?.value ?? null,
    };

    if (!noteIdRef.current || !isAutoSaveOn) {
      return;
    }

    if (previous.noteId !== noteId) {
      return;
    }

    const titleChanged = previous.title !== title;

    const coverChanged = !areCoversEqual(
      {
        type: previous.coverType,
        value: previous.coverValue,
      },
      cover
    );

    if (titleChanged || coverChanged) {
      debouncedSave();
    }
  }, [
    noteId,
    title,
    cover,
    isAutoSaveOn,
    debouncedSave,
  ]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "s"
      ) {
        event.preventDefault();

        clearSaveTimeout();

        if (noteIdRef.current) {
          void save();
        } else {
          void create();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [save, create, clearSaveTimeout]);

  useEffect(() => {
    return () => {
      clearSaveTimeout();
    };
  }, [clearSaveTimeout]);

  return {
    create,
    save,
    auto_detect_title,
    title_a,
  };
}