import { useEffect, useRef, useState, useContext, useMemo } from "react";
import { EditorContent } from "@tiptap/react";
import { useNavigate, useParams } from "react-router-dom";

import CreateFab from "../components/createFab";
import Toolbar from "../components/Toolbar";
import useTiptapEditor from "../hook/useEditor";
import useNotebookCRUD from "../hook/useNotebookCRUD";
import useNoteImage from "../hook/useNoteImage";
import getNoteById from "../services/notebook/getNoteById.services";
import { SettingsContext } from "../store/Settings.context";
import { getThemeColors } from "../constants/Theme";
import checkSaved from "../services/notebook/checkSaved";

export default function EditNote() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [editable, setEditable] = useState(true);
  const [title, setTitle] = useState("Untitled Note");
  const [cover, setCover] = useState(null);
  const [showCoverPanel, setShowCoverPanel] = useState(false);
  const [saved, setSaved] = useState(false);

  const coverImageInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const { settings } = useContext(SettingsContext);
  const COLORS = useMemo(
    () => getThemeColors(settings.theme, settings.accent_color),
    [settings.theme, settings.accent_color],
  );

  const editor = useTiptapEditor({
    spellcheck: Boolean(Number(settings?.spell_check)),
  });
  
  const { save } = useNotebookCRUD({
    editor,
    noteId: id,
    title,
    cover,
    setNoteId: () => {},
    setSaved,
  });

  const { handleImageUpload } = useNoteImage({ editor });

  // ─── Load note ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!editor) return;
    const loadNote = async () => {
      const note = await getNoteById(id);
      if (!note || note.is_deleted) {
        navigate("/");
        return;
      }
      setTitle(note.title);
      if (note.cover_type)
        setCover({ type: note.cover_type, value: note.cover_value });
      editor.commands.setContent(JSON.parse(note.content), false);
    };
    loadNote();
  }, [id, editor, navigate]);

  // ─── Refresh on note-updated event ──────────────────────────────────────────
  // useEffect(() => {
  //   if (!editor) return;
  //   const refresh = async () => {
  //     const note = await getNoteById(id);
  //     if (!note || note.is_deleted) {
  //       navigate("/");
  //       return;
  //     }
  //     setTitle(note.title);
  //     if (note.cover_type)
  //       setCover({ type: note.cover_type, value: note.cover_value });
  //     editor.commands.setContent(JSON.parse(note.content));
  //   };
  //   window.addEventListener("note-updated", refresh);
  //   return () => window.removeEventListener("note-updated", refresh);
  // }, [id, editor, navigate]);

  useEffect(() => {
    (async () => {
      await checkSaved(saved);
    })();
  }, [saved]);

  if (!editor) return null;

  const coverStyle = cover
    ? cover.type === "image"
      ? {
          backgroundImage: `url(${cover.value})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : { background: cover.value }
    : null;

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: COLORS.bgPrimary, color: COLORS.textPrimary }}
    >
      <Toolbar
        cover={cover}
        title={title}
        setTitle={setTitle}
        editable={editable}
        editor={editor}
        setCover={setCover}
        coverImageInputRef={coverImageInputRef}
        setEditable={setEditable}
        showCoverPanel={showCoverPanel}
        setShowCoverPanel={setShowCoverPanel}
        imageInputRef={imageInputRef}
        noteId={id}
        setNoteId={() => {}}
        setSaved={setSaved}
      />

      <div className="editor overflow-y-auto overflow-x-hidden flex-1">
        {cover && (
          <div className="w-full h-50 shrink-0 relative" style={coverStyle}>
            <input
              placeholder="Enter title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="absolute bottom-12.5 text-center truncate capitalize bg-transparent z-1 text-[40px] outline-0 font-bold flex-1 w-full filter drop-shadow-sm title px-10"
              style={{ color: COLORS.textPrimary }}
            />
            <div
              className="absolute inset-x-0 bottom-0 h-12"
              style={{
                background: `linear-gradient(to top, ${COLORS.bgPrimary}, transparent)`,
              }}
            />
          </div>
        )}

        <div className="flex-1">
          <div className="max-w-3xl mx-auto">
            <EditorContent
              editor={editor}
              spellCheck
              className="px-8 py-6 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      <CreateFab title="save" onClick={save} />

    </div>
  );
}
