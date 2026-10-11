import { useEffect, useRef, useState, useContext, useMemo } from "react";

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

import { EditorContent } from "@tiptap/react";

import { useSearchParams, useBlocker } from "react-router-dom";

import Toolbar from "../components/Toolbar";
import useTiptapEditor from "../hook/useEditor";
import useNotebookCRUD from "../hook/useNotebookCRUD";
import useNoteImage from "../hook/useNoteImage";

import checkSaved from "../services/notebook/checkSaved";
import { SettingsContext } from "../store/Settings.context";
import { getThemeColors } from "../constants/Theme";

import { templates } from "../../public/templates";
import { marked } from "marked";

import { Button } from "@/components/ui/button";
import { Pen } from "lucide-react";

const loadTemplates = (id) => {
  return templates.find((template) => template.id === id);
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
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

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

  
  const blocker = useBlocker(isDirty);

  

  useEffect(() => {
    if (blocker.state === "blocked") {
      
      setShowLeaveDialog(true);
    }
  }, [blocker.state]);

  const handleLeave = () => {
    setShowLeaveDialog(false);

    if (blocker.state === "blocked") {
      blocker.proceed();
    }
  };

  const handleStay = () => {
    setShowLeaveDialog(false);

    if (blocker.state === "blocked") {
      blocker.reset();
    }
  };



  
  useEffect(() => {
    if (!editor || !id) return;

    
    setTemLoading(true);

    try {
      const template = loadTemplates(id);

      if (!template) return;

      const html = marked.parse(template.content);

      editor.commands.setContent(html, false);
      setTitle(template.title);

      if (template.cover) {
        setCover({
          type: "image",
          value: template.cover,
        });
      }
    } finally {
      setTemLoading(false);
    }
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
    if (!editor) return;

    const handleUpdate = () => {
      setIsDirty(true);
      setSaved(false);
    };

    editor.on("update", handleUpdate);

    return () => {
      editor.off("update", handleUpdate);
    };
  }, [editor]);

  
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
          'input, textarea, select, [contenteditable="true"], [role="dialog"]',
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
    if (saved) {
      
      setIsDirty(false);
    }

    void checkSaved(saved);
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
      <div className="flex h-screen flex-col items-center justify-center">
        <div
          className="h-16 w-16 animate-spin rounded-full border-b-2"
          style={{ borderColor: COLORS.accent }}
        />
      </div>
    );
  }

  return (
    <div
      className="flex h-screen flex-col overflow-hidden"
      style={{
        backgroundColor: COLORS.bgPrimary,
        color: COLORS.textPrimary,
      }}
    >
      <Toolbar
        cover={cover}
        title={title || title_a}
        setTitle={(value) => {
          setTitle(value);
          setIsDirty(true);
          setSaved(false);
        }}
        editable={editable}
        editor={editor}
        setCover={(value) => {
          setCover(value);
          setIsDirty(true);
          setSaved(false);
        }}
        coverImageInputRef={coverImageInputRef}
        setEditable={setEditable}
        showCoverPanel={showCoverPanel}
        setShowCoverPanel={setShowCoverPanel}
        imageInputRef={imageInputRef}
        noteId={noteId}
        setNoteId={setNoteId}
        setSaved={setSaved}
      />

      <div className="editor flex-1 overflow-x-hidden overflow-y-auto">
        {cover && (
          <div className="relative h-50 w-full shrink-0" style={coverStyle}>
            <input
              placeholder="Enter title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setIsDirty(true);
                setSaved(false);
              }}
              className="title absolute inset-x-0 bottom-12.5 z-1 w-full truncate bg-transparent px-10 text-center text-[40px] font-bold capitalize outline-0 drop-shadow-sm"
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
          <div className="mx-auto max-w-3xl">
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
              spellCheck
              className="px-8 py-6 focus:outline-none"
              style={{ overflowX: "auto" }}
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

      <Button
        onClick={create}
        className="fixed bottom-6 right-6 z-50 cursor-pointer"
        style={{
          backgroundColor: COLORS.accent,
          color: COLORS.bgPrimary,
        }}
      >
        <Pen size={24} />
        Save Note
      </Button>

      <AlertDialog
        open={showLeaveDialog}
        onOpenChange={(open) => {
          if (!open) {
            handleStay();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave without saving?</AlertDialogTitle>

            <AlertDialogDescription>
              You have unsaved changes in this note. If you leave this page,
              your changes may be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleStay}>
              Keep editing
            </AlertDialogCancel>

            <AlertDialogAction onClick={handleLeave}>
              Leave page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
