import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search as SearchIcon,
  FileText,
  X,
  Command,
  LoaderCircle,
} from "lucide-react";

import readNote from "../services/notebook/readNote.services";
import { SettingsContext } from "../store/Settings.context";
import { getThemeColors } from "../constants/Theme";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";

function extractText(node) {
  if (!node) return "";

  if (node.type === "taskList" || node.type === "taskItem") {
    return "";
  }

  if (node.type === "text") {
    return node.text || "";
  }

  return (node.content || []).map(extractText).join(" ");
}

function getNoteText(content) {
  try {
    const parsedContent =
      typeof content === "string" ? JSON.parse(content) : content;

    return extractText(parsedContent).replace(/\s+/g, " ").trim();
  } catch {
    return "";
  }
}

export default function SearchBar({ open, onClose }) {
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { settings } = useContext(SettingsContext);

  const COLORS = useMemo(
    () => getThemeColors(settings.theme, settings.accent_color),
    [settings.theme, settings.accent_color],
  );

  // Load notes whenever the search dialog opens.
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function getNotes() {
      setLoading(true);
      setError("");

      try {
        const data = await readNote();

        if (!cancelled) {
          setNotes(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load notes for search:", err);

        if (!cancelled) {
          setError("Unable to load notes. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    getNotes();

    return () => {
      cancelled = true;
    };
  }, [open]);

  // Reset the search query when the dialog closes.
  useEffect(() => {
    if (!open) {
      setQuery("");
      setError("");
    }
  }, [open]);

  // Search note titles and content.
  const filteredNotes = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return notes;
    }

    return notes.filter((note) => {
      const title = (note.title || "").toLowerCase();
      const content = getNoteText(note.content).toLowerCase();

      return title.includes(search) || content.includes(search);
    });
  }, [notes, query]);

  // Open a note and close the dialog.
  const handleOpenNote = (noteId) => {
    navigate(`/read/note/${noteId}`);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex h-[80vh] max-h-[700px] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
        style={{
          backgroundColor: `${COLORS.bgSecondary}`,
          backdropFilter: "blur(24px)",
          borderColor: COLORS.border,
          color: COLORS.textPrimary,
          boxShadow: "0 20px 80px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Accessible dialog heading */}
        <DialogHeader className="sr-only">
          <DialogTitle>Search notes</DialogTitle>
          <DialogDescription>
            Search your notes by title or content.
          </DialogDescription>
        </DialogHeader>

        {/* Search header */}
        <div className="flex shrink-0 items-center gap-3 px-4 py-4 sm:px-5">
          <SearchIcon
            className="shrink-0"
            size={20}
            style={{ color: COLORS.textMuted }}
          />

          <Input
            autoFocus
            type="search"
            placeholder="Search notes..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-10 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            style={{
              color: COLORS.textPrimary,
            }}
          />

          <Badge
            variant="outline"
            className="hidden shrink-0 items-center gap-1 font-normal sm:inline-flex p-2"
            style={{
              borderColor: COLORS.border,
              backgroundColor: COLORS.bgHover,
              color: COLORS.textMuted,
            }}
          >
            <Command size={12} />
            ESC
          </Badge>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close search"
            className="shrink-0"
            style={{ color: COLORS.textMuted }}
          >
            <X size={18} />
          </Button>
        </div>

        <Separator style={{ backgroundColor: COLORS.border }} />

        {/* Result count */}
        <div
          className="flex shrink-0 items-center justify-between px-5 py-3 text-xs"
          style={{ color: COLORS.textMuted }}
        >
          <span>
            {loading
              ? "Searching notes..."
              : `${filteredNotes.length} result${
                  filteredNotes.length === 1 ? "" : "s"
                }`}
          </span>

          {query.trim() && !loading && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setQuery("")}
              style={{ color: COLORS.textMuted }}
            >
              Clear search
            </Button>
          )}
        </div>

        <Separator style={{ backgroundColor: COLORS.border }} />

        {/* Search results */}
        <ScrollArea className="min-h-0 flex-1">
          <div className="p-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <LoaderCircle
                  size={24}
                  className="animate-spin"
                  style={{ color: COLORS.textMuted }}
                />

                <p
                  className="text-sm"
                  style={{ color: COLORS.textMuted }}
                >
                  Loading notes...
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <p
                  className="text-sm"
                  role="alert"
                  style={{ color: COLORS.textPrimary }}
                >
                  {error}
                </p>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Reopen-triggered loading can be initiated by
                    // closing and opening the dialog again.
                    onClose();
                  }}
                >
                  Close
                </Button>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div
                  className="mb-4 flex h-14 w-14 items-center justify-center "
                  style={{ backgroundColor: COLORS.bgHover }}
                >
                  <SearchIcon
                    size={24}
                    style={{ color: COLORS.textSubtle }}
                  />
                </div>

                <h3
                  className="font-medium"
                  style={{ color: COLORS.textPrimary }}
                >
                  {query.trim() ? "No notes found" : "No notes yet"}
                </h3>

                <p
                  className="mt-1 text-sm"
                  style={{ color: COLORS.textSubtle }}
                >
                  {query.trim()
                    ? "Try searching with another keyword."
                    : "Create a note to see it here."}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredNotes.map((note) => {
                  const preview = getNoteText(note.content);

                  return (
                    <Button
                      key={note.id}
                      type="button"
                      variant="ghost"
                      onClick={() => handleOpenNote(note.id)}
                      className="h-auto w-full capitalize tracking-normal  justify-start gap-3 whitespace-normal  px-3 py-3 text-left"
                      style={{
                        color: COLORS.textPrimary,
                      }}
                    >
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
                        style={{ backgroundColor: COLORS.bgHover }}
                      >
                        <FileText
                          size={16}
                          style={{ color: COLORS.textMuted }}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-medium">
                          {note.title || "Untitled Note"}
                        </h3>

                        <p
                          className="mt-1 line-clamp-2 text-xs font-normal"
                          style={{ color: COLORS.textMuted }}
                        >
                          {preview || "No content"}
                        </p>
                      </div>
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <Separator style={{ backgroundColor: COLORS.border }} />

        <div
          className="hidden shrink-0 items-center justify-between px-5 py-3 text-xs sm:flex"
          style={{ color: COLORS.textMuted }}
        >
          <span>Search by note title or content</span>
          <span>Press ESC to close</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}