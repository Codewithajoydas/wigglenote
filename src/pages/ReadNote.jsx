import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import HorizontalRule from "@tiptap/extension-horizontal-rule";

import {
  Pencil,
  Star,
  Pin,
  MoreVertical,
  Trash2,
  FileCode2,
  FileDown,
  FolderInput,
  Edit,
  FileText,
} from "lucide-react";

import CreateFab from "../components/createFab";
import getNoteById from "../services/notebook/getNoteById.services";
import deleteNote from "../services/notebook/deleteNote.services";
import favNote from "../services/notebook/favNote.services";
import pinNote from "../services/notebook/pinNote.services";
import ContextMenu from "../components/contextMenu";
import Header from "../components/Header";
import { generateHTML } from "@tiptap/core";
import exportPdf from "../services/notebook/downloadPDFNote";
import TurndownService from "turndown";
import { SettingsContext } from "../store/Settings.context";
import useTiptapEditor from "../hook/useEditor";
import { getThemeColors } from "../constants/Theme";
import { cloudSync } from "@/lib/cloud-sync";

// ─── Font size map ────────────────────────────────────────────────────────────
const FONT_SIZE_MAP = {
  small: "text-sm",
  medium: "text-base",
  large: "text-lg",
};

// ─── Header action button ─────────────────────────────────────────────────────

/**
 * A themed icon button used in the note header bar.
 *
 * @param {object}                           props
 * @param {() => void}                       props.onClick  - Click handler
 * @param {boolean}                          [props.active] - Highlights button with accent color when true (e.g. pinned, favorited)
 * @param {boolean}                          [props.danger] - Applies red hover style when true (e.g. delete)
 * @param {string}                           props.title    - Tooltip text shown on hover
 * @param {React.ReactNode}                  props.children - Icon to render inside the button
 * @param {ReturnType<typeof getThemeColors>} props.COLORS  - Resolved color tokens for the current theme and accent
 */
function HeaderAction({ onClick, active, danger, title, children, COLORS }) {
  const baseStyle = {
    color: danger
      ? COLORS.textMuted
      : active
        ? COLORS.accentText
        : COLORS.textMuted,
    backgroundColor: active ? `${COLORS.accent}18` : "transparent",
  };

  return (
    <button
      title={title}
      onClick={onClick}
      className="h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-150"
      style={baseStyle}
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
        e.currentTarget.style.backgroundColor = active
          ? `${COLORS.accent}18`
          : "transparent";
        e.currentTarget.style.color = danger
          ? COLORS.textMuted
          : active
            ? COLORS.accentText
            : COLORS.textMuted;
      }}
    >
      {children}
    </button>
  );
}

// ─── Cover ───────────────────────────────────────────────────────────────────

/**
 * @param {{ type: "image" | "gradient" | "color", value: string, children: React.ReactNode }} props
 */
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

// ─── ReadNote ─────────────────────────────────────────────────────────────────

export default function ReadNote() {
  const { settings } = useContext(SettingsContext);

  /**
   * Resolved color tokens for the current theme + accent.
   * All UI colors should be derived from this — never hardcode theme-dependent
   * hex values elsewhere in this component.
   *
   * @type {ReturnType<typeof getThemeColors>}
   */
  const COLORS = useMemo(
    () => getThemeColors(settings.theme, settings.accent_color),
    [settings.theme, settings.accent_color],
  );

  const turndown = new TurndownService();
  const navigate = useNavigate();
  const { id } = useParams();
  const [note, setNote] = useState(null);
  const [menu, setMenu] = useState({ visible: false, x: 0, y: 0 });
  const editor = useTiptapEditor();
  useEffect(() => {
    editor?.setOptions({ editable: false });
  }, [editor]);

  // ─── Load note ─────────────────────────────────────────────────────────────
  const loadNote = async () => {
    try {
      const data = await getNoteById(id);
      console.log(data);
      if (!data || data.is_deleted) {
        navigate("/");
        return;
      }
      setNote(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadNote();
    window.addEventListener("note-updated", loadNote);
    return () => window.removeEventListener("note-updated", loadNote);
  }, [id]);


  const content = useMemo(() => {
    if (!note?.content) return {};
    try {
      console.log("Notebook Content:- ", JSON.parse(note));
      return JSON.parse(note.content);
    } catch {
      return {};
    }
  }, [note]);

  useEffect(() => {
    if (editor && note) editor.commands.setContent(content);
  }, [editor, note, content]);

  // ─── Actions ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    const ok = window.confirm("Delete this note? This cannot be undone.");
    if (!ok) return;
    try {
      await deleteNote(note.id);
      window.dispatchEvent(new CustomEvent("note-updated"));
      navigate("/");
    } catch (e) {
      console.error(e);
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

  // ─── Context menu items ────────────────────────────────────────────────────
  const items = [
    {
      label: "Edit",
      icon: <Edit size={15} />,
      action: () => navigate(`/edit/note/${note.id}`),
    },
    {
      label: "Move to folder",
      icon: <FolderInput size={15} />,
      action: () => {},
      disabled: true,
    },
    { separator: true },
    {
      label: note?.is_favorite ? "Remove from favorites" : "Add to favorites",
      icon: <Star size={15} />,
      action: handleFav,
    },
    {
      label: note?.is_pinned ? "Unpin" : "Pin to top",
      icon: <Pin size={15} />,
      action: handlePin,
    },
    { separator: true },
    {
      label: "Export as Markdown",
      icon: <FileCode2 size={15} />,
      action: () => {
        if (!note) return;
        const html = generateHTML(JSON.parse(note.content), [
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
        a.download = `${note.title}.md`;
        a.click();
      },
    },
    {
      label: "Export as PDF",
      icon: <FileDown size={15} />,
      action: async () => {
        if (!note) return;
        const html = generateHTML(JSON.parse(note.content), [
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
        await exportPdf(html, note.title);
      },
    },
    { separator: true },
    {
      label: "Delete",
      icon: <Trash2 size={15} />,
      action: handleDelete,
      danger: true,
    },
  ];

  // ─── Loading state ─────────────────────────────────────────────────────────
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

  // ─── Derived style from settings ───────────────────────────────────────────
  const fontSizeClass = FONT_SIZE_MAP[settings.font_size] ?? "text-base";
  const wordWrapClass = settings.word_wrap
    ? "break-words"
    : "whitespace-nowrap overflow-x-auto";

  // Avoids repeating the ternary in JSX
  const titleSizeClass =
    fontSizeClass === "text-sm"
      ? "text-3xl"
      : fontSizeClass === "text-lg"
        ? "text-5xl"
        : "text-4xl";

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
            title="Edit note"
            onClick={() => navigate(`/edit/note/${note.id}`)}
          >
            <Pencil size={15} />
          </HeaderAction>

          <HeaderAction
            COLORS={COLORS}
            title={
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
            title={note.is_pinned ? "Unpin" : "Pin to top"}
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
            title="Delete note"
            danger
            onClick={handleDelete}
          >
            <Trash2 size={15} />
          </HeaderAction>

          <HeaderAction
            COLORS={COLORS}
            title="More options"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setMenu({
                visible: true,
                x: rect.right - 180,
                y: rect.bottom + 6,
              });
            }}
          >
            <MoreVertical size={15} />
          </HeaderAction>
        </div>
      </Header>

      {/* ── Content ── */}
      <main className="flex-1 overflow-auto">
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
          <EditorContent
            editor={editor}
            spellCheck={!!settings.spell_check}
            className={`
              prose max-w-none focus:outline-none
              ${fontSizeClass}
              ${wordWrapClass}
              prose-headings:font-semibold
              prose-p:leading-relaxed
              prose-code:px-1 prose-code:rounded
              prose-a:no-underline hover:prose-a:underline
            `}
            style={{
              color: COLORS.textPrimary,
            }}
          />
        </div>
      </main>

      <CreateFab
        title="Edit"
        icon={<Pencil size={16} />}
        onClick={() => navigate(`/edit/note/${note.id}`)}
      />

      <ContextMenu
        {...menu}
        items={items}
        onClose={() => setMenu((prev) => ({ ...prev, visible: false }))}
      />
    </div>
  );
}
