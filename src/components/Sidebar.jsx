import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "/wigglenote_logo.svg";
import {
  Search,
  Star,
  Trash2,
  Settings,
  FileText,
  Ellipsis,
  Pin,
  PenLine,
  FolderInput,
  FileCode2,
  FileDown,
  Edit,
  LayoutTemplate,
  Plus,
  ArrowRight,
} from "lucide-react";
import readNote from "../services/notebook/readNote.services";
import SearchBar from "./Search";
import renameNotes from "../services/notebook/renameNote.services";
import favNote from "../services/notebook/favNote.services";
import pinNote from "../services/notebook/pinNote.services";
import { generateHTML } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import TextAlign from "@tiptap/extension-text-align";
import TurndownService from "turndown";
import exportPdf from "../services/notebook/downloadPDFNote";
import deleteNote from "../services/notebook/deleteNote.services";
import { SettingsContext } from "../store/Settings.context";
import { getThemeColors } from "../constants/Theme";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "./ui/context-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

// StarterKit v3 mein Link, Underline, HorizontalRule already included hain
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

const MIN_WIDTH = 180;
const MAX_WIDTH = 480;
const DEFAULT_WIDTH = 256;
const WIDTH_KEY = "sidebar-width";
const MENU_ITEM = "capitalize tracking-normal";
const IS_MAC =
  typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);

// ─── Nav item used for quick actions + collections ────────────────────────────
function SideNavLink({ to, icon, children, colors }) {
  return (
    <NavLink
      to={to}
      className="relative flex items-center gap-2.5 px-3 py-2 text-sm transition-colors duration-150"
      style={({ isActive }) => ({
        color: isActive ? colors.textPrimary : colors.textMuted,
        backgroundColor: isActive ? colors.bgHover : "transparent",
      })}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = colors.bgHover;
      }}
      onMouseLeave={(e) => {
        // active link ka bg wapas NavLink ke style se aata hai, isliye class check
        if (!e.currentTarget.classList.contains("active")) {
          e.currentTarget.style.backgroundColor = "transparent";
        }
      }}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5"
              style={{ backgroundColor: colors.accent }}
            />
          )}
          <span
            className="shrink-0"
            style={{ color: isActive ? colors.accent : colors.textPrimary }}
          >
            {icon}
          </span>
          <span
            className="font-semibold truncate"
            style={{ color: isActive ? colors.accent : colors.textPrimary }}
          >
            {children}
          </span>
        </>
      )}
    </NavLink>
  );
}

// ─── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ children, count, colors }) {
  return (
    <div className="flex items-center justify-between px-3 mb-1.5 mt-4 first:mt-0">
      <span
        className="text-[10px] font-semibold tracking-widest uppercase"
        style={{ color: colors.textMuted }}
      >
        {children}
      </span>
      {count !== undefined && (
        <span
          className="text-[10px] font-mono"
          style={{ color: colors.textSubtle }}
        >
          {count}
        </span>
      )}
    </div>
  );
}

// ─── One note row + its context menu ──────────────────────────────────────────
function NoteRow({
  note,
  colors,
  menuStyle,
  onOpen,
  onEdit,
  onRename,
  onFav,
  onPin,
  onExportMarkdown,
  onExportPdf,
  onDelete,
}) {
  // "..." click pe wahi shadcn context menu khule
  const openMenuFromButton = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.closest("a")?.dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        clientX: e.clientX,
        clientY: e.clientY,
      }),
    );
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger render={<div />}>
        <NavLink
          to={`/read/note/${note.id}`}
          className="relative group flex items-center gap-2.5 px-3 py-2 transition-colors duration-150"
          style={({ isActive }) => ({
            backgroundColor: isActive ? colors.bgHover : "transparent",
            color: isActive ? colors.textPrimary : colors.textMuted,
          })}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.bgHover;
          }}
          onMouseLeave={(e) => {
            if (!e.currentTarget.classList.contains("active")) {
              e.currentTarget.style.backgroundColor = "transparent";
            }
          }}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5"
                  style={{ backgroundColor: colors.accent }}
                />
              )}
              <FileText
                size={14}
                className="shrink-0 transition-colors"
                style={{
                  color: isActive ? colors.accent : colors.textSubtle,
                }}
              />
              <span className="flex-1 min-w-0 text-xs font-medium truncate leading-relaxed">
                {note.title || "Untitled"}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {Boolean(note.is_pinned) && (
                  <Pin size={11} style={{ color: colors.textSubtle }} />
                )}
                <span
                  role="button"
                  tabIndex={0}
                  aria-label="Note options"
                  className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity p-0.5 cursor-pointer"
                  style={{ color: colors.textSubtle }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = colors.textPrimary)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = colors.textSubtle)
                  }
                  onClick={openMenuFromButton}
                >
                  <Ellipsis size={13} />
                </span>
              </div>
            </>
          )}
        </NavLink>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-52" style={menuStyle}>
        <ContextMenuItem className={MENU_ITEM} onClick={onOpen}>
          <FileText size={15} /> Open
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem className={MENU_ITEM} onClick={onRename}>
          <PenLine size={15} /> Rename
        </ContextMenuItem>
        <ContextMenuItem className={MENU_ITEM} onClick={onEdit}>
          <Edit size={15} /> Edit
        </ContextMenuItem>
        <ContextMenuItem disabled className={MENU_ITEM}>
          <FolderInput size={15} /> Move to folder
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem className={MENU_ITEM} onClick={onFav}>
          <Star size={15} />
          {note.is_favorite ? "Remove from favorites" : "Add to favorites"}
        </ContextMenuItem>
        <ContextMenuItem className={MENU_ITEM} onClick={onPin}>
          <Pin size={15} />
          {note.is_pinned ? "Unpin" : "Pin to top"}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem className={MENU_ITEM} onClick={onExportMarkdown}>
          <FileCode2 size={15} /> Export as Markdown
        </ContextMenuItem>
        <ContextMenuItem className={MENU_ITEM} onClick={onExportPdf}>
          <FileDown size={15} /> Export as PDF
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          className={MENU_ITEM}
          variant="destructive"
          onClick={onDelete}
        >
          <Trash2 size={15} /> Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────
export default function Sidebar() {
  const turndown = useMemo(() => new TurndownService(), []);
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [newTitle, setNewTitle] = useState("");

  // ---THEME------------------------------
  const { settings } = useContext(SettingsContext);
  const COLORS = useMemo(
    () => getThemeColors(settings.theme, settings.accent_color),
    [settings.theme, settings.accent_color],
  );

  // Ctrl+K (Windows/Linux) aur Cmd+K (Mac)
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // ─── Resize (width yaad rehti hai) ────────────────────────────────────────
  const sidebarRef = useRef(null);
  const isResizing = useRef(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      const saved = Number(localStorage.getItem(WIDTH_KEY));
      return saved >= MIN_WIDTH && saved <= MAX_WIDTH ? saved : DEFAULT_WIDTH;
    } catch {
      return DEFAULT_WIDTH;
    }
  });

  const handleMouseDown = () => {
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing.current) return;
      if (e.clientX >= MIN_WIDTH && e.clientX <= MAX_WIDTH) {
        setSidebarWidth(e.clientX);
      }
    };
    const handleMouseUp = () => {
      if (!isResizing.current) return;
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      setSidebarWidth((w) => {
        try {
          localStorage.setItem(WIDTH_KEY, String(w));
        } catch {
          /* ignore */
        }
        return w;
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // ─── Notes ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const refresh = async () => {
      const data = await readNote();
      setNotes(data || []);
    };
    refresh();
    window.addEventListener("note-updated", refresh);
    return () => window.removeEventListener("note-updated", refresh);
  }, []);

  // ─── Note actions ─────────────────────────────────────────────────────────
  const notify = () => window.dispatchEvent(new Event("note-updated"));

  const exportMarkdown = (note) => {
    const html = generateHTML(JSON.parse(note.content), EXPORT_EXTENSIONS);
    const markdown = turndown.turndown(html);
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${note.title || "Untitled"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdfNote = async (note) => {
    const html = generateHTML(JSON.parse(note.content), EXPORT_EXTENSIONS);
    await exportPdf(html, note.title);
  };

  // Context menu band hone ke baad focus trigger pe wapas jaata hai,
  // isliye dialogs ko ek tick baad kholte hain
  const handleDelete = (note) => setTimeout(() => setDeleteTarget(note), 0);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteNote(deleteTarget.id);
      notify();
    } catch (error) {
      console.error("Failed to delete note:", error);
    } finally {
      setDeleteTarget(null);
    }
  };

  const openRename = (note) => {
    setSelectedNote(note);
    setNewTitle(note.title || "");
    setTimeout(() => setRenameOpen(true), 0);
  };

  const handleRename = async (event) => {
    event?.preventDefault();
    if (!selectedNote) return;
    const title = newTitle.trim();
    if (!title) return;
    if (title === (selectedNote.title || "")) {
      setRenameOpen(false);
      return;
    }
    try {
      await renameNotes({ id: selectedNote.id, title });
      setRenameOpen(false);
      notify(); // listener notes refresh kar deta hai
    } catch (error) {
      console.error("Failed to rename note:", error);
    }
  };

  const toggleFav = async (note) => {
    await favNote(note.id);
    notify();
  };

  const togglePin = async (note) => {
    await pinNote(note.id);
    notify();
  };

  const menuStyle = {
    backgroundColor: COLORS.bgPrimary,
    color: COLORS.textPrimary,
    borderColor: COLORS.border,
    WebkitAppRegion: "no-drag",
  };

  const { data: session, isLoading } = authClient.useSession();
  const user = isLoading ? null : session?.user;
  const verified = Boolean(user?.emailVerified);

  return (
    <>
      <aside
        ref={sidebarRef}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          width: sidebarWidth,
          background: COLORS.bgSecondary,
          color: COLORS.textPrimary,
          borderColor: COLORS.border,
          borderRightWidth: 1,
          borderRightStyle: "solid",
        }}
        className="relative h-screen flex flex-col select-none shrink-0"
      >
        {/* ── Brand header ── */}
        <div
          className="flex items-center gap-2.5 px-4 h-16 shrink-0"
          style={{ borderBottom: `1px solid ${COLORS.border}` }}
        >
          <img
            src={logo}
            alt=""
            className="w-10 h-10 shrink-0"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.parentElement.innerHTML = `<span class="text-xs font-bold" style="color: ${COLORS.accent};">W</span>`;
            }}
          />
          <div className="min-w-0">
            <p
              className="text font-bold  leading-none"
              style={{ color: COLORS.textPrimary, fontSize: "14px" }}
            >
              WiggleNote
            </p>
            <p
              className="text-[10px] mt-1 leading-none truncate"
              style={{ color: COLORS.textSubtle }}
            >
              Personal workspace
            </p>
          </div>
        </div>

        {/* ── Actions (fixed) ── */}
        <div className="shrink-0 px-2 pt-3 space-y-0.5">
          <SectionLabel colors={COLORS}>Actions</SectionLabel>
          <SideNavLink
            to="/create-note"
            icon={<Plus size={15} />}
            colors={COLORS}
          >
            New Note
          </SideNavLink>
          <SideNavLink
            to="/templates"
            icon={<LayoutTemplate size={15} />}
            colors={COLORS}
          >
            Templates
          </SideNavLink>
          <Button
            variant="secondary"
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 text-sm transition-all"
            style={{
              color: COLORS.textMuted,
              WebkitAppRegion: "no-drag",
            }}
          >
            <span className="flex items-center gap-2.5">
              <Search size={15} style={{ color: COLORS.textPrimary }} />
              <span
                className="font-semibold"
                style={{ color: COLORS.textPrimary }}
              >
                Search
              </span>
            </span>
            <kbd
              className="text-[10px] px-1.5 py-0.5 font-mono"
              style={{
                backgroundColor: COLORS.bgHover,
                color: COLORS.textSubtle,
              }}
            >
              {IS_MAC ? "⌘K" : "Ctrl K"}
            </kbd>
          </Button>
        </div>

        {/* ── Notes (sirf ye list scroll hoti hai) ── */}
        <div className="shrink-0 px-2 pt-1">
          <SectionLabel count={notes.length} colors={COLORS}>
            Notes
          </SectionLabel>
        </div>
        <div
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 [&::-webkit-scrollbar]:hidden"
          style={{ WebkitAppRegion: "no-drag" }}
        >
          {notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div
                className="w-10 h-10 flex items-center justify-center mb-3"
                style={{
                  backgroundColor: COLORS.bgHover,
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                <FileText size={18} style={{ color: COLORS.accent }} />
              </div>
              <p
                className="text-xs font-medium"
                style={{ color: COLORS.textPrimary }}
              >
                No notes yet
              </p>
              <p
                className="text-[11px] mt-1 leading-relaxed"
                style={{ color: COLORS.textSecondary }}
              >
                Create your first note to get started
              </p>
            </div>
          ) : (
            <div className="space-y-0.5 pb-2">
              {notes.map((note) => (
                <NoteRow
                  key={note.id}
                  note={note}
                  colors={COLORS}
                  menuStyle={menuStyle}
                  onOpen={() => navigate(`/read/note/${note.id}`)}
                  onEdit={() => navigate(`/edit/note/${note.id}`)}
                  onRename={() => openRename(note)}
                  onFav={() => toggleFav(note)}
                  onPin={() => togglePin(note)}
                  onExportMarkdown={() => exportMarkdown(note)}
                  onExportPdf={() => exportPdfNote(note)}
                  onDelete={() => handleDelete(note)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Collections (fixed, hamesha dikhte hain) ── */}
        <div
          className="shrink-0 px-2 pt-2 pb-2 space-y-0.5"
          style={{ borderTop: `1px solid ${COLORS.border}` }}
        >
          <SectionLabel colors={COLORS}>Collections</SectionLabel>
          <SideNavLink
            to="/favorites"
            icon={<Star size={15} />}
            colors={COLORS}
          >
            Favorites
          </SideNavLink>
          <SideNavLink to="/trash" icon={<Trash2 size={15} />} colors={COLORS}>
            Trash
          </SideNavLink>
        </div>

        {/* ── Footer ── */}
        <div
          className="shrink-0 px-2 py-2"
          style={{ borderTop: `1px solid ${COLORS.border}` }}
        >
          <SideNavLink
            to="/settings"
            icon={<Settings size={15} />}
            colors={COLORS}
          >
            Settings
          </SideNavLink>
        </div>

        {/* ── Profile ── */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate("/profile")}
          onKeyDown={(e) => e.key === "Enter" && navigate("/profile")}
          className="shrink-0 flex items-center gap-2.5 px-3 py-2.5 group cursor-pointer transition-colors"
          style={{
            borderTop: `1px solid ${COLORS.border}`,
            backgroundColor: verified ? "transparent" : "rgba(239,68,68,0.12)",
          }}
          onMouseEnter={(e) => {
            if (verified)
              e.currentTarget.style.backgroundColor = COLORS.bgHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = verified
              ? "transparent"
              : "rgba(239,68,68,0.12)";
          }}
        >
          {user?.image ? (
            <img
              src={user.image}
              alt={user.name || "Profile"}
              referrerPolicy="no-referrer"
              className="size-8 shrink-0 object-cover"
            />
          ) : (
            <div
              className="size-8 shrink-0 flex items-center justify-center text-xs font-bold uppercase"
              style={{
                backgroundColor: COLORS.bgHover,
                color: COLORS.accent,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              {(user?.name || user?.email || "?").charAt(0)}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-semibold truncate leading-tight"
              style={{ color: COLORS.textPrimary }}
            >
              {user?.name || "Guest"}
            </p>
            {verified ? (
              <p
                className="text-[11px] truncate leading-tight mt-0.5"
                style={{ color: COLORS.textMuted }}
              >
                {user?.email}
              </p>
            ) : (
              user && (
                <p
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/verify-email");
                  }}
                  className="text-[11px] truncate leading-tight mt-0.5 font-medium hover:underline"
                  style={{ color: "#f87171" }}
                >
                  Email not verified
                </p>
              )
            )}
          </div>

          <ArrowRight
            size={15}
            className="shrink-0 group-hover:translate-x-1 transition-transform"
            style={{ color: COLORS.textMuted }}
          />
        </div>

        {/* ── Drag handle ── */}
        <div
          onMouseDown={handleMouseDown}
          onDoubleClick={() => setSidebarWidth(DEFAULT_WIDTH)}
          className="absolute right-0 top-0 h-full w-1 cursor-col-resize transition-colors z-50"
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = `${COLORS.accent}66`)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
        />
      </aside>

      <SearchBar open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* ── Rename Note Dialog ── */}
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
                name="title"
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
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

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete note?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.title || "Untitled"}" will be moved to trash. You
              can restore it from there.
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
    </>
  );
}
