import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";

import { EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { generateHTML } from "@tiptap/core";
import TurndownService from "turndown";

import {
  Pencil,
  PenLine,
  Star,
  Pin,
  MoreVertical,
  Trash2,
  FileCode2,
  FileDown,
  FolderInput,
  Edit,
  FileText,
  Pen,
} from "lucide-react";

import getNoteById from "../services/notebook/getNoteById.services";
import deleteNote from "../services/notebook/deleteNote.services";
import favNote from "../services/notebook/favNote.services";
import pinNote from "../services/notebook/pinNote.services";
import renameNotes from "../services/notebook/renameNote.services";
import exportPdf from "../services/notebook/downloadPDFNote";
import Header from "../components/Header";
import { SettingsContext } from "../store/Settings.context";
import useTiptapEditor from "../hook/useEditor";
import { getThemeColors } from "../constants/Theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


const FONT_SIZE_MAP = {
  small: "text-sm",
  medium: "text-base",
  large: "text-lg",
};



const EXPORT_EXTENSIONS = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    link: { openOnClick: false, autolink: true, linkOnPaste: true },
  }),
  Image.configure({ inline: false }),
  Highlight.configure({ multicolor: true }),
  TaskList,
  TaskItem.configure({ nested: true }),
  TextAlign.configure({ types: ["heading", "paragraph"] }),
];


function HeaderAction({ label, onClick, active, danger, children, COLORS }) {
  const restColor = active ? COLORS.accentText : COLORS.textMuted;
  const restBg = active ? `${COLORS.accent}18` : "transparent";

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            aria-label={label}
            onClick={onClick}
            className="p-3"
            style={{ color: restColor, backgroundColor: restBg }}
            onMouseEnter={(e) => {
              if (danger) {
                e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.10)";
                e.currentTarget.style.color = "#f87171";
              } else if (!active) {
                e.currentTarget.style.backgroundColor = COLORS.bgHover;
                e.currentTarget.style.color = COLORS.textPrimary;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = restBg;
              e.currentTarget.style.color = restColor;
            }}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent
        style={{
          backgroundColor: COLORS.textPrimary,
          color: COLORS.bgPrimary,
        }}
      >
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

const Cover = ({ type, value, children }) => {
  switch (type) {
    case "image":
      return (
        <div
          className="w-full h-50 shrink-0 relative bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${value})` }}
        >
          {children}
        </div>
      );
    case "gradient":
      return (
        <div
          className="w-full h-50 shrink-0 relative"
          style={{ background: value }}
        >
          {children}
        </div>
      );
    case "color":
      return (
        <div
          className="w-full h-50 shrink-0 relative"
          style={{ backgroundColor: value }}
        >
          {children}
        </div>
      );
    default:
      return null;
  }
};

export default function ReadNote() {
  const { settings } = useContext(SettingsContext);
  const COLORS = useMemo(
    () => getThemeColors(settings.theme, settings.accent_color),
    [settings.theme, settings.accent_color],
  );

  const turndown = useMemo(() => new TurndownService(), []);
  const navigate = useNavigate();
  const { id } = useParams();
  const [note, setNote] = useState(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const mainRef = useRef(null);
  const editor = useTiptapEditor();

  useEffect(() => {
    editor?.setOptions({ editable: false });
  }, [editor]);

  const loadNote = useCallback(async () => {
    try {
      const data = await getNoteById(id);
      if (!data || data.is_deleted) {
        navigate("/");
        return;
      }
      setNote(data);
    } catch (error) {
      console.error(error);
    }
  }, [id, navigate]);

  useEffect(() => {
    
    loadNote();
    window.addEventListener("note-updated", loadNote);
    return () => window.removeEventListener("note-updated", loadNote);
  }, [loadNote]);

  const content = useMemo(() => {
    if (!note?.content) return {};
    try {
      return JSON.parse(note.content);
    } catch {
      return {};
    }
  }, [note]);

  useEffect(() => {
    if (editor && note) editor.commands.setContent(content);
  }, [editor, note, content]);

  
  
  
  const handleDelete = () => setTimeout(() => setDeleteOpen(true), 0);

  const confirmDelete = async () => {
    try {
      await deleteNote(note.id);
      window.dispatchEvent(new CustomEvent("note-updated"));
      navigate("/");
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteOpen(false);
    }
  };

  const openRename = () => {
    setNewTitle(note?.title || "");
    setTimeout(() => setRenameOpen(true), 0);
  };

  const handleRename = async (event) => {
    event?.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    if (title === (note.title || "")) {
      setRenameOpen(false);
      return;
    }
    try {
      await renameNotes({ id: note.id, title });
      setRenameOpen(false);
      window.dispatchEvent(new CustomEvent("note-updated")); 
    } catch (error) {
      console.error("Failed to rename note:", error);
    }
  };

  const handlePin = async () => {
    try {
      await pinNote(note.id);
      loadNote();
    } catch (e) {
      console.error(e);
    }
  };

  const handleFav = async () => {
    try {
      await favNote(note.id);
      loadNote();
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportMarkdown = () => {
    if (!note) return;
    const html = generateHTML(JSON.parse(note.content), EXPORT_EXTENSIONS);
    const markdown = turndown.turndown(html);
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${note.title}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = async () => {
    if (!note) return;
    const html = generateHTML(JSON.parse(note.content), EXPORT_EXTENSIONS);
    await exportPdf(html, note.title);
  };

  
  const openMenuFromButton = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mainRef.current?.dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        clientX: rect.right - 180,
        clientY: rect.bottom + 6,
      }),
    );
  };

  const menuStyle = {
    backgroundColor: COLORS.bgSecondary,
    color: COLORS.textPrimary,
    borderColor: COLORS.border,
    WebkitAppRegion: "no-drag",
  };

  
  if (!editor || !note) {
    return (
      <div
        className="h-screen flex items-center justify-center"
        style={{ backgroundColor: COLORS.bgPrimary }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center animate-pulse"
            style={{
              backgroundColor: COLORS.bgHover,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <FileText size={16} style={{ color: COLORS.textMuted }} />
          </div>
          <p className="text-xs" style={{ color: COLORS.textMuted }}>
            Loading note…
          </p>
        </div>
      </div>
    );
  }

  
  const fontSizeClass = FONT_SIZE_MAP[settings.font_size] ?? "text-base";
  const wordWrapClass = settings.word_wrap
    ? "break-words"
    : "whitespace-nowrap overflow-x-auto";

  return (
    <div
      className="h-screen flex flex-col"
      style={{ backgroundColor: COLORS.bgPrimary, color: COLORS.textPrimary }}
    >
      {/* ── Header ── */}
      <Header title={note.title}>
        <div className="flex items-center gap-0.5">
          <HeaderAction
            COLORS={COLORS}
            label="Edit note"
            onClick={() => navigate(`/edit/note/${note.id}`)}
          >
            <Pencil size={15} />
          </HeaderAction>

          <HeaderAction
            COLORS={COLORS}
            label={
              note.is_favorite ? "Remove from favorites" : "Add to favorites"
            }
            active={!!note.is_favorite}
            onClick={handleFav}
          >
            <Star
              size={15}
              style={
                note.is_favorite ? { fill: "#facc15", stroke: "#facc15" } : {}
              }
            />
          </HeaderAction>

          <HeaderAction
            COLORS={COLORS}
            label={note.is_pinned ? "Unpin" : "Pin to top"}
            active={!!note.is_pinned}
            onClick={handlePin}
          >
            <Pin
              size={15}
              style={
                note.is_pinned
                  ? { fill: COLORS.accentText, stroke: COLORS.accentText }
                  : {}
              }
            />
          </HeaderAction>

          <HeaderAction
            COLORS={COLORS}
            label="Delete note"
            danger
            onClick={handleDelete}
          >
            <Trash2 size={15} />
          </HeaderAction>

          <HeaderAction
            COLORS={COLORS}
            label="More options"
            onClick={openMenuFromButton}
          >
            <MoreVertical size={15} />
          </HeaderAction>
        </div>
      </Header>

      {/* ── Content (right-click yahan context menu kholta hai) ── */}
      <ContextMenu>
        <ContextMenuTrigger
          ref={mainRef}
          render={<main className="flex-1 overflow-auto" />}
        >
          {/* ── Cover ── */}
          {note.cover_type && (
            <Cover type={note.cover_type} value={note.cover_value}>
              <div className="absolute bottom-3 left-55 right-8">
                <h1
                  className={`font-bold text-white mb-1 leading-snug drop-shadow-md truncate title`}
                >
                  {note.title || "Untitled"}
                </h1>
                <div className="flex items-center gap-3 mb-8">
                  {Boolean(note.is_pinned) && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full font-medium">
                      <Pin size={9} className="fill-blue-300" /> Pinned
                    </span>
                  )}
                  {Boolean(note.is_favorite) && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-yellow-300 bg-yellow-500/20 px-2 py-0.5 rounded-full font-medium">
                      <Star size={9} className="fill-yellow-300" /> Favorite
                    </span>
                  )}
                  {note.created_at && (
                    <span className="text-[11px] text-white/70">
                      {new Date(note.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>
              </div>
              {/* Fade cover into page background */}
              <div
                className="absolute inset-x-0 bottom-0 h-16"
                style={{
                  background: `linear-gradient(to top, ${COLORS.bgPrimary}, transparent)`,
                }}
              />
            </Cover>
          )}

          {/* ── Title area (no cover) ── */}
          {!note.cover_type && (
            <div className="max-w-3xl mx-auto px-8 pt-8 pb-2">
              <h1
                className={`font-bold mb-2 leading-snug title  truncate capitalize`}
                style={{ color: COLORS.textPrimary }}
              >
                {note.title || "Untitled"}
              </h1>
              <div className="flex items-center gap-3 mb-1">
                {Boolean(note.is_pinned) && (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{
                      color: COLORS.accentText,
                      backgroundColor: `${COLORS.accent}18`,
                    }}
                  >
                    <Pin size={9} style={{ fill: COLORS.accentText }} /> Pinned
                  </span>
                )}
                {Boolean(note.is_favorite) && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-yellow-600 bg-yellow-500/10 px-2 py-0.5 rounded-full font-medium">
                    <Star size={9} className="fill-yellow-600" /> Favorite
                  </span>
                )}
                {note.created_at && (
                  <span
                    className="text-[11px]"
                    style={{ color: COLORS.textMuted }}
                  >
                    {new Date(note.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ── Editor ── */}
          <div className="max-w-3xl mx-auto px-8 py-8">
                 <>
              <style>
    {`
      .tiptap ::selection {
        background-color: ${COLORS.accent}cc;
        color: ${COLORS.textPrimary};
      }
    `}
  </style>
            <EditorContent
              editor={editor}
              spellCheck={!!settings.spell_check}
              className={`
                min-h-50
                prose max-w-none focus:outline-none
                ${fontSizeClass}
                ${wordWrapClass}
                prose-headings:font-semibold
                prose-p:leading-relaxed
                prose-code:px-1 prose-code:rounded
                prose-a:no-underline hover:prose-a:underline
              `}
              style={{ color: COLORS.textPrimary }}
            />
            </>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-52" style={menuStyle}>
          <ContextMenuItem
            onClick={openRename}
            className="capitalize truncate-normal"
          >
            <PenLine size={15} /> Rename
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => navigate(`/edit/note/${note.id}`)}
            className="capitalize truncate-normal"
          >
            <Edit size={15} /> Edit
          </ContextMenuItem>
          <ContextMenuItem disabled className="capitalize truncate-normal">
            <FolderInput size={15} /> Move to folder
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={handleFav}
            className="capitalize truncate-normal"
          >
            <Star size={15} />
            {note.is_favorite ? "Remove from favorites" : "Add to favorites"}
          </ContextMenuItem>
          <ContextMenuItem
            onClick={handlePin}
            className="capitalize truncate-normal"
          >
            <Pin size={15} />
            {note.is_pinned ? "Unpin" : "Pin to top"}
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={handleExportMarkdown}
            className="capitalize truncate-normal"
          >
            <FileCode2 size={15} /> Export as Markdown
          </ContextMenuItem>
          <ContextMenuItem
            onClick={handleExportPdf}
            className="capitalize truncate-normal"
          >
            <FileDown size={15} /> Export as PDF
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            variant="destructive"
            onClick={handleDelete}
            className="capitalize truncate-normal"
          >
            <Trash2 size={15} /> Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <Button
        onClick={() => navigate(`/edit/note/${note.id}`)}
        className="fixed bottom-6 right-6 z-50 cursor-pointer"
        style={{ backgroundColor: COLORS.accent, color: COLORS.bgPrimary }}
      >
        <Pen size={24} />
        Open Editor Mode
      </Button>

      {/* ── Rename dialog ── */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={handleRename}>
            <DialogHeader>
              <DialogTitle>Rename note</DialogTitle>
              <DialogDescription>
                Enter a new title for your note.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-5">
              <Label htmlFor="note-title">Note title</Label>
              <Input
                id="note-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter note title"
                autoFocus
                maxLength={200}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenameOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!newTitle.trim()}>
                Rename
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete note?</AlertDialogTitle>
            <AlertDialogDescription>
              "{note.title || "Untitled"}" will be deleted. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}