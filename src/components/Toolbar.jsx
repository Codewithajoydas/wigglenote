import { useCallback, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ToolbarButton from "./ui/toolbarButton";
import { CoverPanel } from "./CoverPanel";
import createNote from "../services/notebook/createNote.services";
import {
  ArrowLeft,
  Palette,
  Pencil,
  PencilOff,
  Save,
  Undo2,
  Redo2,
  Eraser,
  Bold,
  Italic,
  UnderlineIcon,
  Strikethrough,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code2,
  Minus,
  Link2,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from "lucide-react";
import Divider from "./ui/Divider";
import { SettingsContext } from "../store/Settings.context";
import { getThemeColors } from "../constants/Theme";
import { toast } from "./ui/toast";
/**
 * @function Toolbar
 * @description A toolbar for editing notes
 *
 * @param {Object} props
 * @param {string} props.title - The title of the note
 * @param {Function} props.setTitle - A function to set the title of the note
 * @param {Object} props.cover - The cover of the note
 * @param {Function} props.setCover - A function to set the cover of the note
 * @param {Object} props.editor - The editor instance
 * @param {boolean} props.editable - Whether the note is editable or not
 * @param {Function} props.setEditable - A function to set the editable state of the note
 * @param {boolean} props.showCoverPanel - Whether the cover panel is open or not
 * @param {Function} props.setShowCoverPanel - A function to set the open state of the cover panel
 * @param {Object} props.coverImageInputRef - A reference to the cover image input element
 * @param {Object} props.imageInputRef - A reference to the image input element
 * @param {string} props.noteId - The id of the note
 * @param {Function} props.setNoteId - A function to set the id of the note
 * @param {Function} props.setSaved - A function to set the saved state of the note
 * @param {Function} props.setAlert - A function to set the alert
 * @returns {JSX.Element}
 *
 */

export default function Toolbar({
  title,
  setTitle,
  cover,
  setCover,
  editor,
  editable,
  setEditable,
  showCoverPanel,
  setShowCoverPanel,
  coverImageInputRef,
  imageInputRef,
  noteId,
  setNoteId,
  setSaved,
}) {
  const navigate = useNavigate();
  const handleSubmit = useCallback(async () => {
    if (!editor) return;
    if (noteId) return;
    if (editor.isEmpty) return;

    try {
      const note = {
        title: title.trim() || "Untitled Note",
        content: JSON.stringify(editor.getJSON()),
        cover_type: cover?.type ?? null,
        cover_value: cover?.value ?? null,
      };

      const result = await createNote(note);
      setNoteId(result.id);
      setSaved(true);
      toast.add({
        type: "success",
        title: "Saved",
        description: "Note created successfully.",
      });
      window.dispatchEvent(new CustomEvent("note-updated"));
    } catch (err) {
      console.error(err);
    }
  }, [editor, noteId, title, cover]);

  const { settings } = useContext(SettingsContext);
  const COLORS = useMemo(
    () => getThemeColors(settings.theme, settings.accent_color),
    [settings.theme, settings.accent_color],
  );

  return (
    <div
      className="sticky top-0 z-50  backdrop-blur-xl border-b "
      style={{
        backgroundColor: COLORS.bgSecondary,
        borderColor: COLORS.border,
      }}
    >
      {/* Top row: title + meta actions */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-1 pr-[150px]">
        <button
          onClick={() => navigate(-1)}
          className="
                       h-9
                       w-9
                       rounded-xl
                       flex
                       items-center
                       justify-center
                       transition-all
                       duration-200
                     "
          title="Go back"
          style={{
            color: COLORS.textPrimary,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.bgHover;
            e.currentTarget.style.color = COLORS.accent;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = COLORS.textPrimary;
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <input
          type="text"
          value={title}
          placeholder="Untitled Note"
          onChange={(e) => setTitle(e.target.value)}
          disabled={!editable}
          className="flex-1 min-w-0 text-base font-semibold bg-transparent  placeholder:text-zinc-600 outline-none w-full truncate capitalize "
          style={{
            color: COLORS.textPrimary,
          }}
        />
        <div className="flex items-center gap-1 shrink-0">
          {/* Cover settings */}
          <div className="relative">
            <ToolbarButton
              label="Cover"
              active={showCoverPanel}
              onClick={() => {
                setShowCoverPanel((v) => !v);
              }}
            >
              <Palette size={16} />
            </ToolbarButton>
            {showCoverPanel && (
              <CoverPanel
                cover={cover}
                onChange={(val) => {
                  setCover(val);
                  if (val?.type !== "image") setShowCoverPanel(false);
                }}
                onClose={() => setShowCoverPanel(false)}
                imageInputRef={coverImageInputRef}
              />
            )}
          </div>

          {/* Edit toggle */}
          <ToolbarButton
            label={editable ? "Lock" : "Edit"}
            onClick={() => {
              const next = !editable;
              setEditable(next);
              editor.setEditable(next);
            }}
          >
            {editable ? <Pencil size={16} /> : <PencilOff size={16} />}
          </ToolbarButton>

          {/* Save */}
          <ToolbarButton label="Save" onClick={handleSubmit}>
            <Save size={16} />
          </ToolbarButton>
        </div>
      </div>

      {/* Bottom row: formatting toolbar */}
      <div className="flex items-center gap-0.5 px-3 pb-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {/* History */}
        <ToolbarButton
          label="Undo"
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Clear"
          disabled={!editable}
          onClick={() =>
            editor.chain().focus().unsetAllMarks().clearNodes().run()
          }
        >
          <Eraser size={15} />
        </ToolbarButton>

        <Divider />

        {/* Inline formatting */}
        <ToolbarButton
          label="Bold"
          disabled={!editable}
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          disabled={!editable}
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Under"
          disabled={!editable}
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Strike"
          disabled={!editable}
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Mark"
          disabled={!editable}
          active={editor.isActive("highlight")}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
        >
          <Highlighter size={15} />
        </ToolbarButton>

        <Divider />

        {/* Headings */}
        <ToolbarButton
          label="H1"
          disabled={!editable}
          active={editor.isActive("heading", { level: 1 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          <Heading1 size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="H2"
          disabled={!editable}
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="H3"
          disabled={!editable}
          active={editor.isActive("heading", { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <Heading3 size={15} />
        </ToolbarButton>

        <Divider />

        {/* Lists */}
        <ToolbarButton
          label="Bullet"
          disabled={!editable}
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Order"
          disabled={!editable}
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Tasks"
          disabled={!editable}
          active={editor.isActive("taskList")}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          <CheckSquare size={15} />
        </ToolbarButton>

        <Divider />

        {/* Blocks */}
        <ToolbarButton
          label="Quote"
          disabled={!editable}
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Code"
          disabled={!editable}
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
        <Code2 size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Rule"
          disabled={!editable}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus size={15} />
        </ToolbarButton>

        <Divider />

        {/* Link & Image */}
        <ToolbarButton
          label="Link"
          disabled={!editable}
          active={editor.isActive("link")}
          onClick={() => {
            const url = window.prompt("Enter URL");
            if (!url) return;
            editor
              .chain()
              .focus()
              .extendMarkRange("link")
              .setLink({ href: url })
              .run();
          }}
        >
          <Link2 size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Image"
          disabled={!editable}
          onClick={() => imageInputRef.current?.click()}
        >
          <ImageIcon size={15} />
        </ToolbarButton>

        <Divider />

        {/* Alignment */}
        <ToolbarButton
          label="Left"
          disabled={!editable}
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Center"
          disabled={!editable}
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Right"
          disabled={!editable}
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Justify"
          disabled={!editable}
          active={editor.isActive({ textAlign: "justify" })}
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        >
          <AlignJustify size={15} />
        </ToolbarButton>
      </div>
    </div>
  );
}
