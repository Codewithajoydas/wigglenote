import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SettingsContext } from "../store/Settings.context";
import { getThemeColors } from "../constants/Theme";
import TurndownService from "turndown";

import {
  Star,
  Trash2,
  FileText,
  Pin,
  PenLine,
  FolderInput,
  FileCode2,
  FileDown,
  Edit,
  Clock3,
} from "lucide-react";

import Header from "../components/Header";
import ContextMenu from "../components/contextMenu";

import favNote from "../services/notebook/getFavNotes.services";
import renameNotes from "../services/notebook/renameNote.services";
import deleteNote from "../services/notebook/deleteNote.services";
import exportPdf from "../services/notebook/downloadPDFNote";
import pinNote from "../services/notebook/pinNote.services";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { generateHTML } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import TextAlign from "@tiptap/extension-text-align";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Underline from "@tiptap/extension-underline";


const SHARP = { borderRadius: 0 };

export default function FavNote() {
  const turndown = useMemo(() => new TurndownService(), []);
  const [newTitle, setNewTitle] = useState("");
  const { settings } = useContext(SettingsContext);

  const COLORS = useMemo(
    () => getThemeColors(settings.theme, settings.accent_color),
    [settings.theme, settings.accent_color],
  );

  const [notes, setNotes] = useState([]);
  const navigate = useNavigate();
  const [menu, setMenu] = useState({ visible: false, x: 0, y: 0 });
  const [selectedNote, setSelectedNote] = useState(null);
  const [renameOpen, setRenameOpen] = useState(false);

  const getNotes = useCallback(async () => {
    const data = await favNote();
    setNotes(data || []);
  }, []);

  useEffect(() => {
    window.addEventListener("note-updated", getNotes);
    getNotes();
    return () => window.removeEventListener("note-updated", getNotes);
  }, [getNotes]);

  const items = [
    {
      label: "Open",
      icon: <FileText size={15} />,
      action: () => {
        if (!selectedNote) return;
        navigate(`/read/note/${selectedNote.id}`);
      },
    },
    { separator: true },
    {
      label: "Rename",
      icon: <PenLine size={15} />,
      action: () => {
        if (!selectedNote) return;
        setNewTitle(selectedNote.title);
        setRenameOpen(true);
      },
    },
    {
      label: "Edit",
      icon: <Edit size={15} />,
      action: () => {
        if (!selectedNote) return;
        navigate(`/edit/note/${selectedNote.id}`);
      },
    },
    {
      label: "Move to folder",
      icon: <FolderInput size={15} />,
      action: () => {},
      disabled: true,
    },
    { separator: true },
    {
      label: selectedNote?.is_favorite
        ? "Remove from favorites"
        : "Add to favorites",
      icon: <Star size={15} />,
      action: async () => {
        if (!selectedNote) return;
        await favNote(selectedNote.id);
        window.dispatchEvent(new Event("note-updated"));
      },
    },
    {
      label: selectedNote?.is_pinned ? "Unpin" : "Pin to top",
      icon: <Pin size={15} />,
      action: async () => {
        if (!selectedNote) return;
        await pinNote(selectedNote.id);
        window.dispatchEvent(new Event("note-updated"));
      },
    },
    { separator: true },
    {
      label: "Export as Markdown",
      icon: <FileCode2 size={15} />,
      action: () => {
        if (!selectedNote) return;
        const html = generateHTML(JSON.parse(selectedNote.content), [
          StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
          Image.configure({ inline: false }),
          Underline,
          Highlight.configure({ multicolor: true }),
          Link.configure({
            openOnClick: false,
            autolink: true,
            linkOnPaste: true,
          }),
          HorizontalRule,
          TaskList,
          TaskItem.configure({ nested: true }),
          TextAlign.configure({ types: ["heading", "paragraph"] }),
        ]);
        const markdown = turndown.turndown(html);
        const blob = new Blob([markdown], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${selectedNote.title}.md`;
        a.click();
      },
    },
    {
      label: "Export as PDF",
      icon: <FileDown size={15} />,
      action: async () => {
        if (!selectedNote) return;
        const html = generateHTML(JSON.parse(selectedNote.content), [
          StarterKit,
          Image,
          Underline,
          Highlight,
          Link,
          HorizontalRule,
          TaskList,
          TaskItem,
          TextAlign,
        ]);
        await exportPdf(html, selectedNote.title);
      },
    },
    { separator: true },
    {
      label: "Delete",
      icon: <Trash2 size={15} />,
      action: () => {
        if (!selectedNote) return;
        deleteNote(selectedNote.id);
        window.dispatchEvent(new Event("note-updated"));
      },
      danger: true,
    },
  ];

  const handleRename = async () => {
    if (!selectedNote) return;
    await renameNotes({ id: selectedNote.id, title: newTitle });
    setRenameOpen(false);
    await getNotes();
    window.dispatchEvent(new Event("note-updated"));
  };

  const handleContextMenu = (e, note) => {
    e.preventDefault();
    setSelectedNote(note);
    setMenu({ visible: true, x: e.clientX, y: e.clientY });
  };

  const getPreview = (content) => {
    try {
      const json = typeof content === "string" ? JSON.parse(content) : content;
      const extractText = (node) => {
        if (node.text) return node.text;
        if (node.content) return node.content.map(extractText).join(" ");
        return "";
      };
      return extractText(json).slice(0, 160);
    } catch {
      return "No preview available";
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const updated = new Date(date);
    const diff = Math.floor((now - updated) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return updated.toLocaleDateString();
  };

  const S = useMemo(
    () => ({
      iconBox: { ...SHARP, backgroundColor: COLORS.bgHover },
      starBox: {
        ...SHARP,
        backgroundColor: `${COLORS.accent}1a`,
        border: `1px solid ${COLORS.accent}33`,
      },
      dialog: {
        ...SHARP,
        backgroundColor: COLORS.bgSecondary,
        border: `1px solid ${COLORS.border}`,
        color: COLORS.textPrimary,
      },
      input: {
        ...SHARP,
        backgroundColor: COLORS.bgHover,
        border: `1px solid ${COLORS.border}`,
        color: COLORS.textPrimary,
      },
      cancelBtn: {
        ...SHARP,
        backgroundColor: COLORS.bgHover,
        color: COLORS.textMuted,
      },
      accentBtn: {
        ...SHARP,
        backgroundColor: COLORS.accent,
        color: "#fff",
      },
    }),
    [COLORS],
  );

  const cardStyle = {
    ...SHARP,
    backgroundColor: COLORS.bgSecondary,
    border: `1px solid ${COLORS.border}`,
  };

  const cardEnter = (withShadow) => (e) => {
    e.currentTarget.style.borderColor = COLORS.accent;
    e.currentTarget.style.backgroundColor = COLORS.bgHover;
    if (withShadow) e.currentTarget.style.boxShadow = `0 0 30px ${COLORS.accent}26`;
  };
  const cardLeave = (withShadow) => (e) => {
    e.currentTarget.style.borderColor = COLORS.border;
    e.currentTarget.style.backgroundColor = COLORS.bgSecondary;
    if (withShadow) e.currentTarget.style.boxShadow = "none";
  };

  return (
    <div
      className="h-full overflow-y-auto"
      style={{ backgroundColor: COLORS.bgPrimary, color: COLORS.textPrimary }}
    >
      <Header title="Favorite Notes" />

      <div className="max-w-7xl mx-auto p-6">
        {notes.length === 0 ? (
          <div className="h-[70vh] flex items-center justify-center">
            <div className="text-center max-w-md">
              <div
                className="mx-auto h-28 w-28 flex items-center justify-center"
                style={{
                  backgroundColor: COLORS.bgSecondary,
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                <Star
                  size={50}
                  style={{ fill: COLORS.accent, color: COLORS.accent }}
                />
              </div>

              <h2
                className="text-2xl font-bold mt-6"
                style={{ color: COLORS.textPrimary }}
              >
                Nothing Starred Yet
              </h2>

              <p
                className="mt-3 leading-relaxed"
                style={{ color: COLORS.textMuted }}
              >
                Important notes that you mark as favorites will appear here for
                quick access.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-5">
            {settings.default_view === "list" ? (
              <div className="flex flex-col gap-2">
                {notes.map((note) => (
                  <Card
                    key={note.id}
                    onContextMenu={(e) => handleContextMenu(e, note)}
                    onClick={() => navigate(`/read/note/${note.id}`)}
                    className="group gap-0 py-0 shadow-none cursor-pointer transition-all duration-200"
                    style={cardStyle}
                    onMouseEnter={cardEnter(false)}
                    onMouseLeave={cardLeave(false)}
                  >
                    <CardContent className="flex items-center gap-4 px-4 py-3">
                      <div
                        className="h-9 w-9 shrink-0 flex items-center justify-center"
                        style={S.iconBox}
                      >
                        <FileText
                          size={16}
                          style={{ color: COLORS.textMuted }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h2
                          className="font-semibold text-sm truncate"
                          style={{ color: COLORS.textPrimary }}
                        >
                          {note.title || "Untitled Note"}
                        </h2>
                        <p
                          className="text-xs truncate"
                          style={{ color: COLORS.textMuted }}
                        >
                          {getPreview(note.content)}
                        </p>
                      </div>

                      <div
                        className="flex items-center gap-2 text-xs shrink-0"
                        style={{ color: COLORS.textSubtle }}
                      >
                        <Clock3 size={13} />
                        <span>{formatDate(note.updated_at)}</span>
                      </div>

                      <div
                        className="h-7 w-7 shrink-0 flex items-center justify-center"
                        style={S.starBox}
                      >
                        <Star
                          size={12}
                          style={{ fill: COLORS.accent, color: COLORS.accent }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {notes.map((note) => (
                  <Card
                    key={note.id}
                    onContextMenu={(e) => handleContextMenu(e, note)}
                    onClick={() => navigate(`/read/note/${note.id}`)}
                    className="group gap-0 py-0 shadow-none cursor-pointer transition-all duration-200 hover:-translate-y-1"
                    style={cardStyle}
                    onMouseEnter={cardEnter(true)}
                    onMouseLeave={cardLeave(true)}
                  >
                    <CardContent className="p-5">
                      {/* Card header */}
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className="h-10 w-10 flex items-center justify-center"
                          style={S.iconBox}
                        >
                          <FileText
                            size={18}
                            style={{ color: COLORS.textMuted }}
                          />
                        </div>

                        <div
                          className="h-8 w-8 flex items-center justify-center"
                          style={S.starBox}
                        >
                          <Star
                            size={14}
                            style={{
                              fill: COLORS.accent,
                              color: COLORS.accent,
                            }}
                          />
                        </div>
                      </div>

                      {/* Title */}
                      <h2
                        className="font-semibold text-sm line-clamp-2 mb-3"
                        style={{ color: COLORS.textPrimary }}
                      >
                        {note.title || "Untitled Note"}
                      </h2>

                      {/* Preview */}
                      <p
                        className="text-xs leading-relaxed line-clamp-4 min-h-[80px]"
                        style={{ color: COLORS.textMuted }}
                      >
                        {getPreview(note.content)}
                      </p>

                      {/* Footer */}
                      <div
                        className="mt-5 pt-4 flex items-center justify-between"
                        style={{ borderTop: `1px solid ${COLORS.border}` }}
                      >
                        <div
                          className="flex items-center gap-2 text-xs"
                          style={{ color: COLORS.textMuted }}
                        >
                          <Clock3 size={13} />
                          <span>{formatDate(note.updated_at)}</span>
                        </div>

                        <div
                          className="text-xs font-medium opacity-0 translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"
                          style={{ color: COLORS.accent }}
                        >
                          Open →
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rename dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="w-80 max-w-[90vw] p-5 gap-0" style={S.dialog}>
          <DialogHeader className="mb-4 gap-1">
            <DialogTitle
              className="text-sm font-semibold"
              style={{ color: COLORS.textPrimary }}
            >
              Rename note
            </DialogTitle>
            <DialogDescription
              className="text-xs"
              style={{ color: COLORS.textSubtle }}
            >
              Enter a new title for this note.
            </DialogDescription>
          </DialogHeader>

          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            autoFocus
            className="text-sm"
            style={S.input}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = `${COLORS.accent}80`)
            }
            onBlur={(e) => (e.currentTarget.style.borderColor = COLORS.border)}
            placeholder="Note title"
          />

          <DialogFooter className="flex-row justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setRenameOpen(false)}
              className="h-8 px-3 text-xs"
              style={S.cancelBtn}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = COLORS.textPrimary)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = COLORS.textMuted)
              }
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleRename}
              className="h-8 px-3 text-xs font-medium"
              style={S.accentBtn}
              onMouseEnter={(e) =>
                (e.currentTarget.style.filter = "brightness(1.1)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.filter = "brightness(1)")
              }
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ContextMenu
        {...menu}
        items={items}
        onClose={() => setMenu((prev) => ({ ...prev, visible: false }))}
      />
    </div>
  );
}