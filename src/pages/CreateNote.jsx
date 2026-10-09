import { useEffect, useRef, useState, useContext, useMemo } from "react";
import { EditorContent } from "@tiptap/react";
import CreateFab from "../components/createFab";
import Toolbar from "../components/Toolbar";
import useTiptapEditor from "../hook/useEditor";
import useNotebookCRUD from "../hook/useNotebookCRUD";
import useNoteImage from "../hook/useNoteImage";
import checkSaved from "../services/notebook/checkSaved";
import { SettingsContext } from "../store/Settings.context";
import { getThemeColors } from "../constants/Theme";
import { useSearchParams } from "react-router-dom";
import { templates } from "../../public/templates";
import { marked } from "marked";

const loadTemplates = (id) => {
  const response = templates.find((template) => template.id === id);
  return response;
};

export default function CreateNote() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const [temLoading, setTemLoading] = useState(false);
  const [noteId, setNoteId] = useState(null);
  const [editable, setEditable] = useState(true);
  const [title, setTitle] = useState("");
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

  // ---- Load template -------
  useEffect(() => {
    if (!editor || !id) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTemLoading(true);
    const template = loadTemplates(id);
    if (!template) {
      setTemLoading(false);
      return;
    }
    const html = marked.parse(template.content);
    editor.commands.setContent(html, false);
    setTitle(template.title);
    if (template.cover) {
      setCover({
        type: "image",
        value: template.cover,
      });
    }
    setTemLoading(false);
  }, [editor, id]);

  const { create, title_a } = useNotebookCRUD({
    editor,
    noteId,
    title,
    cover,
    setNoteId,
    setSaved,
  });

useEffect(() => {
  if (!editor || temLoading) return;

  const handleKeyboard = (event) => {
    if (
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.key.length !== 1
    ) {
      return;
    }

    const target = event.target;

    if (
      target?.closest(
        'input, textarea, select, [contenteditable="true"], [role="dialog"]'
      )
    ) {
      return;
    }

    editor.commands.focus();
  };

  window.addEventListener("keydown", handleKeyboard);

  return () => {
    window.removeEventListener("keydown", handleKeyboard);
  };
}, [editor, temLoading]);

  const { handleImageUpload } = useNoteImage({ editor });

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

  if (temLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <div
          className="animate-spin rounded-full h-16 w-16 border-b-2"
          style={{
            borderColor: COLORS.accent,
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: COLORS.bgPrimary, color: COLORS.textPrimary }}
    >
      <Toolbar
        cover={cover}
        title={title || title_a}
        setTitle={setTitle}
        editable={editable}
        editor={editor}
        setCover={setCover}
        coverImageInputRef={coverImageInputRef}
        setEditable={setEditable}
        showCoverPanel={showCoverPanel}
        setShowCoverPanel={setShowCoverPanel}
        imageInputRef={imageInputRef}
        noteId={noteId}
        setNoteId={setNoteId}
        setSaved={setSaved}
      />

      <div className="editor overflow-y-auto overflow-x-hidden flex-1">
        {cover && (
          <div className="w-full h-50 shrink-0 relative" style={coverStyle}>
            <input
              placeholder="Enter title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="absolute bottom-12.5 text-center truncate capitalize bg-transparent z-1 text-[40px] outline-0 font-bold flex-1 w-full filter drop-shadow-sm title px-10 inset-x-0"
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
              style={{
                overflowX: "auto",
              }}
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
      <CreateFab title="save" onClick={create} />
      
    </div>
  );
}
