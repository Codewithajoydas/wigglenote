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
import ContextMenu from "./contextMenu";
import renameNotes from "../services/notebook/renameNote.services";
import favNote from "../services/notebook/favNote.services";
import pinNote from "../services/notebook/pinNote.services";
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
import TurndownService from "turndown";
import exportPdf from "../services/notebook/downloadPDFNote";
import deleteNote from "../services/notebook/deleteNote.services";
import { SettingsContext } from "../store/Settings.context";
import { getThemeColors } from "../constants/Theme";
import { authClient } from "@/lib/auth-client";

// ─── Nav item used for quick actions + collections ────────────────────────────
function SideNavLink({ to, icon, children, colors }) {
  return (
    <NavLink
      to={to}
      className="relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 group"
      style={({ isActive }) => ({
        color: isActive ? colors.textPrimary : colors.textMuted,
        backgroundColor: isActive ? colors.bgHover : "transparent",
      })}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
              style={{ backgroundColor: colors.accent }}
            />
          )}
          <span
            style={{
              color: isActive ? colors.accent : colors.textPrimary,
              transition: "color 150ms",
            }}
          >
            {icon}
          </span>
          <span
            className="font-semibold"
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
    <div className="flex items-center justify-between px-3 mb-1.5 mt-5 first:mt-0">
      <span
        className="text-[10px] font-semibold tracking-widest"
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

// ─── Main Sidebar ─────────────────────────────────────────────────────────────
export default function Sidebar() {
  const turndown = new TurndownService();
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menu, setMenu] = useState({ visible: false, x: 0, y: 0 });
  const [selectedNote, setSelectedNote] = useState(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  // ---THEME------------------------------
  const { settings } = useContext(SettingsContext);
  const COLORS = useMemo(
    () => getThemeColors(settings.theme, settings.accent_color),
    [settings.theme, settings.accent_color],
  );

  useEffect(() => {
    window.addEventListener("keydown", (e) => {
      if (e.key === "k" && e.ctrlKey) {
        e.preventDefault();
        setSearchOpen(true);
      }
    });
  }, []);

  // ─── Resize ───────────────────────────────────────────────────────────────
  const sidebarRef = useRef(null);
  const isResizing = useRef(false);
  const [sidebarWidth, setSidebarWidth] = useState(256);

  const handleMouseDown = () => {
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing.current) return;
      const newWidth = e.clientX;
      if (newWidth >= 180 && newWidth <= 480) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
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
    const loadNotes = async () => {
      const data = await readNote();
      setNotes(data || []);
    };
    loadNotes();
  }, []);

  useEffect(() => {
    const refresh = async () => {
      const notes = await readNote();
      setNotes(notes || []);
    };
    window.addEventListener("note-updated", refresh);
    return () => window.removeEventListener("note-updated", refresh);
  }, []);

  const handleContextMenu = (e, note) => {
    e.preventDefault();
    setSelectedNote(note);
    setMenu({ visible: true, x: e.clientX, y: e.clientY });
  };

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
        const confirm = window.confirm(
          "Are you sure you want to delete this note?",
        );
        if (confirm) {
          deleteNote(selectedNote.id);
        } else {
          return;
        }
        window.dispatchEvent(new Event("note-updated"));
      },
      danger: true,
    },
  ];

  const handleRename = async () => {
    if (!selectedNote) return;
    await renameNotes({ id: selectedNote.id, title: newTitle });
    setRenameOpen(false);
    const notes = await readNote();
    setNotes(notes);
    window.dispatchEvent(new Event("note-updated"));
  };

  const { data: session, isLoading } = authClient.useSession();
  const user = isLoading ? null : session?.user;

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
            className="w-10 h-10"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.parentElement.innerHTML = `<span class="text-xs font-bold" style="color: ${COLORS.accent};">W</span>`;
            }}
          />
          <div className="min-w-0">
            <p
              className="text-sm font-semibold tracking-tight leading-none"
              style={{ color: COLORS.textPrimary }}
            >
              WiggleNote
            </p>
            <p
              className="text-[10px] mt-0.5 leading-none"
              style={{ color: COLORS.textSubtle }}
            >
              Personal workspace
            </p>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5 [&::-webkit-scrollbar]:hidden">
          <SectionLabel colors={COLORS}>Actions</SectionLabel>

          {/* New Note — accent filled when active */}
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

          {/* Search button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all group"
            style={{
              color: COLORS.textMuted,
              WebkitAppRegion: "no-drag",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.bgHover;
              e.currentTarget.style.color = COLORS.textPrimary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = COLORS.textMuted;
            }}
          >
            <span className="flex items-center gap-2.5">
              <Search size={15} style={{ color: COLORS.textPrimary }} />
              <span
                className="font-medium"
                style={{ color: COLORS.textPrimary }}
              >
                Search
              </span>
            </span>
            <kbd
              className="text-[10px] px-1.5 py-0.5 rounded font-mono"
              style={{
                backgroundColor: COLORS.bgHover,
                color: COLORS.textSubtle,
              }}
            >
              ⌘K
            </kbd>
          </button>

          <SectionLabel count={notes.length} colors={COLORS}>
            Notes
          </SectionLabel>

          <div style={{ WebkitAppRegion: "no-drag" }}>
            {notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
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
              <div className="space-y-0.5">
                {notes.map((note) => (
                  <NavLink
                    onContextMenu={(e) => handleContextMenu(e, note)}
                    key={note.id}
                    to={`/read/note/${note.id}`}
                    className="relative group flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150"
                    style={({ isActive }) => ({
                      backgroundColor: isActive
                        ? COLORS.bgHover
                        : "transparent",
                      color: isActive ? COLORS.textPrimary : COLORS.textMuted,
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                            style={{ backgroundColor: COLORS.accent }}
                          />
                        )}
                        <FileText
                          size={14}
                          className="shrink-0 transition-colors"
                          style={{
                            color: isActive ? COLORS.accent : COLORS.textSubtle,
                          }}
                        />
                        <span className="flex-1 min-w-0 text-xs font-medium truncate leading-relaxed">
                          {note.title || "Untitled"}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {note.is_pinned !== 0 && (
                            <Pin
                              size={11}
                              style={{ color: COLORS.textSubtle }}
                            />
                          )}
                          <button
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
                            style={{ color: COLORS.textSubtle }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.color = COLORS.textPrimary)
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.color = COLORS.textSubtle)
                            }
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleContextMenu(e, note);
                            }}
                          >
                            <Ellipsis size={13} />
                          </button>
                        </div>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

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
        <div
          onClick={()=>{navigate("/profile")}}
          className="flex items-center gap-2 px-3 py-2 group cursor-pointer"
          style={{
            borderTop: `1px solid ${COLORS.border}`,
            background: user?.emailVerified ? null : "#ff000033",
          }}
        >
          {user?.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="w-6 h-6 rounded-full mr-2"
            />
          ) : (
            <img
              src={"https://dummyimage.com/40x40/000/fff"}
              className="w-8 h-8 rounded-full"
              referrerPolicy="no-referrer"
              alt={user?.name}
            />
          )}
          <span className="flex-1 min-w-0 flex-col">
            <p
              className="font-bold"
             
            >
              {user?.name}
            </p>
            {!user?.emailVerified && (
              <p onClick={(e)=>{e.stopPropagation() ;navigate("/verify-email")}}  style={{
                color: user?.emailVerified ? COLORS.textPrimary : "#ff0000",
              }}>Email Not Verified</p>
            )}
            {user?.emailVerified && <p>{user?.email}</p>}
          </span>
          <ArrowRight size={15} className="group-hover:scale-105 group-hover:translate-x-1 transition-all"/>
        </div>

        {/* ── Drag handle ── */}
        <div
          onMouseDown={handleMouseDown}
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

      {/* ── Rename modal ── */}
      {renameOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-500"
          style={{
            backgroundColor: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="rounded-2xl p-5 w-80 shadow-2xl"
            style={{
              backgroundColor: COLORS.bgSecondary,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <h2
              className="text-sm font-semibold mb-1"
              style={{ color: COLORS.textPrimary }}
            >
              Rename note
            </h2>
            <p className="text-xs mb-4" style={{ color: COLORS.textSubtle }}>
              Enter a new title for this note.
            </p>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              autoFocus
              className="w-full px-3 py-2 text-sm rounded-lg outline-none transition-colors"
              style={{
                backgroundColor: COLORS.bgHover,
                border: `1px solid ${COLORS.border}`,
                color: COLORS.textPrimary,
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = `${COLORS.accent}80`)
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = COLORS.border)
              }
              placeholder="Note title"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setRenameOpen(false)}
                className="px-3 py-1.5 text-xs rounded-lg transition-colors"
                style={{
                  backgroundColor: COLORS.bgHover,
                  color: COLORS.textMuted,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = COLORS.textPrimary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = COLORS.textMuted;
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRename}
                className="px-3 py-1.5 text-xs rounded-lg font-medium text-white transition-colors"
                style={{ backgroundColor: COLORS.accent }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.filter = "brightness(1.1)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.filter = "brightness(1)")
                }
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      <ContextMenu
        {...menu}
        items={items}
        onClose={() => setMenu((prev) => ({ ...prev, visible: false }))}
      />
    </>
  );
}
