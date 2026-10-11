import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Clock3, FileText, Trash2, RotateCcw, X } from "lucide-react";
import Header from "../components/Header";
import getDeleted from "../services/notebook/getDeleted.services";
import restoreNote from "../services/notebook/restoreNote.services";
import deletePermanently from "../services/notebook/deleteForever.services";
import ContextMenu from "../components/contextMenu";
import { SettingsContext } from "../store/Settings.context";
import { getThemeColors } from "../constants/Theme";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

// shadcn components ke default rounded ko inline override karne ke liye
const SHARP = { borderRadius: 0 };

export default function Trash() {
  const [notes, setNotes] = useState([]);
  const [open, setOpen] = useState(false);
  const [openNotice, setOpenNotice] = useState(true);
  const [id, setId] = useState(null);
  const [menu, setMenu] = useState({ visible: false, x: 0, y: 0 });
  const [selectedNote, setSelectedNote] = useState(null);

  const { settings } = useContext(SettingsContext);
  const COLORS = useMemo(
    () => getThemeColors(settings.theme, settings.accent_color),
    [settings.theme, settings.accent_color],
  );

  const S = useMemo(
    () => ({
      iconBox: { ...SHARP, backgroundColor: COLORS.bgHover },
      trashBox: {
        ...SHARP,
        backgroundColor: "rgba(239,68,68,0.1)",
        border: "1px solid rgba(239,68,68,0.2)",
      },
      banner: {
        ...SHARP,
        backgroundColor: "rgba(239,68,68,0.08)",
        border: "1px solid rgba(239,68,68,0.3)",
      },
      card: {
        ...SHARP,
        backgroundColor: COLORS.bgSecondary,
        border: `1px solid ${COLORS.border}`,
      },
      restoreBtn: {
        ...SHARP,
        backgroundColor: "rgba(16,185,129,0.1)",
        color: "#34d399",
      },
      deleteBtn: {
        ...SHARP,
        backgroundColor: "rgba(239,68,68,0.1)",
        color: "#f87171",
      },
      dialog: {
        ...SHARP,
        backgroundColor: COLORS.bgSecondary,
        border: `1px solid ${COLORS.border}`,
        color: COLORS.textPrimary,
      },
      keepBtn: {
        ...SHARP,
        backgroundColor: COLORS.bgHover,
        color: COLORS.textPrimary,
        border: `1px solid ${COLORS.border}`,
      },
    }),
    [COLORS],
  );

  const showAlert = ({ type, title, message }) => {
    requestAnimationFrame(() =>
      toast.add({ type, title, description: message }),
    );
  };

  const getNotes = useCallback(async () => {
    const data = await getDeleted();
    setNotes(data || []);
  }, []);

  useEffect(() => {
    getNotes();
  }, [getNotes]);

  const items = [
    {
      label: "Restore",
      icon: <RotateCcw size={15} />,
      action: () => {
        if (!selectedNote) return;
        restoreData(selectedNote.id);
      },
    },
    { separator: true },
    {
      label: "Delete Forever",
      icon: <Trash2 size={15} />,
      action: () => {
        if (!selectedNote) return;
        setId(selectedNote.id);
        setOpen(true);
      },
      danger: true,
    },
  ];

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

  const restoreData = async (noteId) => {
    try {
      await restoreNote(noteId);
      showAlert({
        type: "success",
        title: "Success",
        message: "Note restored successfully",
      });
      window.dispatchEvent(new CustomEvent("note-updated"));
      getNotes();
    } catch {
      showAlert({
        type: "error",
        title: "Error",
        message: "Failed to restore note",
      });
    }
  };

  const deleteData = async (noteId) => {
    try {
      await deletePermanently(noteId);
      getNotes();
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  const cardEnter = (withShadow) => (e) => {
    e.currentTarget.style.borderColor = COLORS.accent;
    e.currentTarget.style.backgroundColor = COLORS.bgHover;
    if (withShadow)
      e.currentTarget.style.boxShadow = `0 0 30px ${COLORS.accent}26`;
  };
  const cardLeave = (withShadow) => (e) => {
    e.currentTarget.style.borderColor = COLORS.border;
    e.currentTarget.style.backgroundColor = COLORS.bgSecondary;
    if (withShadow) e.currentTarget.style.boxShadow = "none";
  };

  const restoreEnter = (e) =>
    (e.currentTarget.style.backgroundColor = "rgba(16,185,129,0.2)");
  const restoreLeave = (e) =>
    (e.currentTarget.style.backgroundColor = "rgba(16,185,129,0.1)");
  const deleteEnter = (e) =>
    (e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.2)");
  const deleteLeave = (e) =>
    (e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)");

  const ActionButtons = ({ note }) => (
    <div className="flex items-center gap-2 shrink-0">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 px-3 text-xs font-medium"
        style={S.restoreBtn}
        onClick={(e) => {
          e.stopPropagation();
          restoreData(note.id);
        }}
        onMouseEnter={restoreEnter}
        onMouseLeave={restoreLeave}
      >
        Restore
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 px-3 text-xs font-medium"
        style={S.deleteBtn}
        onClick={(e) => {
          e.stopPropagation();
          setId(note.id);
          setOpen(true);
        }}
        onMouseEnter={deleteEnter}
        onMouseLeave={deleteLeave}
      >
        Delete Forever
      </Button>
    </div>
  );

  return (
    <>
      <div
        className="h-full overflow-y-auto"
        style={{ backgroundColor: COLORS.bgPrimary, color: COLORS.textPrimary }}
      >
        <Header title="Trash" />

        {/* Warning banner */}
        {notes.length !== 0 && openNotice && (
          <Card className="gap-0 py-0 shadow-none m-6" style={S.banner}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <h3
                  className="font-semibold text-sm"
                  style={{ color: "#f87171" }}
                >
                  Items in Trash will be permanently deleted after 30 days
                </h3>
                <p
                  className="text-xs mt-1"
                  style={{ color: "rgba(252,165,165,0.7)" }}
                >
                  Restore notes anytime before automatic removal.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Dismiss notice"
                className="size-8"
                style={{ ...SHARP, color: COLORS.textMuted }}
                onClick={() => setOpenNotice(false)}
              >
                <X size={20} />
              </Button>
            </CardContent>
          </Card>
        )}

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
                  <Trash2 size={50} style={{ color: "#ef4444" }} />
                </div>
                <h2
                  className="text-2xl font-bold mt-6"
                  style={{ color: COLORS.textPrimary }}
                >
                  Trash is Empty
                </h2>
                <p className="mt-3" style={{ color: COLORS.textMuted }}>
                  Deleted notes will appear here before permanent removal.
                </p>
              </div>
            </div>
          ) : settings.default_view === "list" ? (
            <div className="flex flex-col gap-2">
              {notes.map((note) => (
                <Card
                  key={note.id}
                  onContextMenu={(e) => handleContextMenu(e, note)}
                  className="group gap-0 py-0 shadow-none cursor-pointer transition-all duration-200"
                  style={S.card}
                  onMouseEnter={cardEnter(false)}
                  onMouseLeave={cardLeave(false)}
                >
                  <CardContent className="flex items-center gap-4 px-4 py-3">
                    <div
                      className="h-9 w-9 shrink-0 flex items-center justify-center"
                      style={S.iconBox}
                    >
                      <FileText size={16} style={{ color: COLORS.textMuted }} />
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

                    <ActionButtons note={note} />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {notes.map((note) => (
                <Card
                  key={note.id}
                  onContextMenu={(e) => handleContextMenu(e, note)}
                  className="group gap-0 py-0 shadow-none cursor-pointer transition-all duration-200 hover:-translate-y-1"
                  style={S.card}
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
                        style={S.trashBox}
                      >
                        <Trash2 size={14} style={{ color: "#ef4444" }} />
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
                      {/* <div
                        className="flex items-center gap-2 text-xs w-fit"
                        style={{ color: COLORS.textMuted }}
                      >
                        <Clock3 size={13} />
                        <span className="flex-1">{formatDate(note.updated_at)}</span>
                      </div> */}

                      <ActionButtons note={note} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Delete confirmation */}
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogContent style={S.dialog}>
            <AlertDialogHeader>
              <AlertDialogTitle style={{ color: COLORS.textPrimary }}>
                Delete Note
              </AlertDialogTitle>
              <AlertDialogDescription style={{ color: COLORS.textSecondary }}>
                This note will be permanently deleted. This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel style={S.keepBtn}>Keep</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                style={SHARP}
                onClick={() => deleteData(id)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <ContextMenu
        h={100}
        {...menu}
        items={items}
        onClose={() => setMenu((prev) => ({ ...prev, visible: false }))}
      />
    </>
  );
}