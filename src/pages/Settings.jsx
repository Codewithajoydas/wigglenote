import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  Palette,
  Type,
  Trash2,
  Info,
  LoaderCircle,
  RotateCcw,
  Save,
  SpellCheck,
  WrapText,
  Monitor,
  LayoutGrid,
  List,
} from "lucide-react";
import Header from "../components/Header";
import updateSettings from "../services/settings/updateSettings.services";
import restoreAllNotes from "../services/notebook/restoreAllNotes.services";
import deleteAllNotes from "../services/notebook/deleteAllNotes.services";
import { SettingsContext } from "../store/Settings.context";
import { getThemeColors } from "../constants/Theme";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { getVersion } from "@/services/settings/getVersion";

export default function Settings() {
  const { settings, setSettings } = useContext(SettingsContext);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [version, setVersion] = useState(null);

useEffect(() => {
  let cancelled = false;

  getVersion()
    .then((v) => {
      if (!cancelled) setVersion(v ?? null);
    })
    .catch((error) => {
      console.error("Failed to get version:", error);
    });

  return () => {
    cancelled = true;
  };
}, []);
  
  const COLORS = useMemo(
    () => getThemeColors(settings.theme, settings.accent_color),
    [settings.theme, settings.accent_color],
  );

  // Shared style objects built from COLORS
  const S = useMemo(
    () => ({
      heading: { color: COLORS.textPrimary },
      sub: { color: COLORS.textSecondary },
      label: { color: COLORS.textPrimary },
      iconBox: { backgroundColor: COLORS.bgHover },
      icon: { color: COLORS.textMuted },
      card: { backgroundColor: COLORS.bgSecondary, Color: COLORS.border },
      separator: { backgroundColor: COLORS.border },
      trigger: {
        backgroundColor: COLORS.bgSecondary,
        color: COLORS.textPrimary,
      },
      content: {
        backgroundColor: COLORS.bgSecondary,
        color: COLORS.textPrimary,
        textTransform: "capitalize",
      },
      outlineBtn: {
        backgroundColor: COLORS.bgSecondary,
        color: COLORS.textPrimary,
      },
      dialog: {
        backgroundColor: COLORS.bgSecondary,
        color: COLORS.textPrimary,
      },
    }),
    [COLORS],
  );

  const update = useCallback(
    async (key, value) => {
      const previousSettings = settings;
      const updatedSettings = { ...settings, [key]: value };
      setSettings(updatedSettings);
      try {
        await updateSettings(updatedSettings);
      } catch (error) {
        console.error("Failed to update settings:", error);
        setSettings(previousSettings);
      }
    },
    [settings, setSettings],
  );

  const restoreNotes = async () => {
    if (isRestoring) return;
    setIsRestoring(true);
    try {
      await restoreAllNotes();
      window.dispatchEvent(new CustomEvent("note-updated"));
    } catch (error) {
      console.error("Failed to restore notes:", error);
    } finally {
      setIsRestoring(false);
    }
  };

  const emptyTrash = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteAllNotes();
      window.dispatchEvent(new CustomEvent("note-updated"));
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Failed to delete notes:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="h-full overflow-y-auto bg-background text-foreground"
      style={{
        backgroundColor: COLORS.bgPrimary,
        color: COLORS.textPrimary,
      }}
    >
      <Header title="Settings" />

      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="space-y-8">
          {/* Appearance */}
          <section className="space-y-4">
            <div>
              <h2 className="text-base font-semibold" style={S.heading}>
                Appearance
              </h2>
              <p className="mt-1 text-sm" style={S.sub}>
                Personalize how your workspace looks.
              </p>
            </div>

            <Card className="overflow-hidden  shadow-none" style={S.card}>
              <CardContent className="p-0">
                {/* Theme */}
                <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex size-9 shrink-0 items-center justify-center"
                      style={S.iconBox}
                    >
                      <Monitor
                        className="size-4"
                        style={S.icon}
                      />
                    </div>
                    <div className="min-w-0">
                      <Label
                        htmlFor="setting-theme"
                        className="text-sm font-medium"
                        style={S.label}
                      >
                        Theme
                      </Label>
                      <p className="mt-1 text-xs" style={S.sub}>
                        Choose your preferred appearance.
                      </p>
                    </div>
                  </div>

                  <Select
                    value={settings.theme ?? ""}
                    onValueChange={(value) => update("theme", value)}
                  >
                    <SelectTrigger
                      id="setting-theme"
                      className="w-full sm:w-40"
                      style={S.trigger}
                    >
                      <SelectValue placeholder="Select theme" className="capitalize" />
                    </SelectTrigger>
                    <SelectContent style={S.content}>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator style={S.separator} />

                {/* Accent color */}
                <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex size-9 shrink-0 items-center justify-center"
                      style={S.iconBox}
                    >
                      <Palette className="size-4" style={S.icon} 
                       />
                    </div>
                    <div className="min-w-0">
                      <Label
                        htmlFor="setting-accent-color"
                        className="text-sm font-medium"
                        style={S.label}
                      >
                        Accent color
                      </Label>
                      <p className="mt-1 text-xs" style={S.sub}>
                        Select your interface accent.
                      </p>
                    </div>
                  </div>

                  <Select
                    value={settings.accent_color ?? ""}
                    onValueChange={(value) => update("accent_color", value)}
                  >
                    <SelectTrigger
                      id="setting-accent-color"
                      className="w-full sm:w-40"
                      style={S.trigger}
                    >
                      <SelectValue placeholder="Select color" className="capitalize" />
                    </SelectTrigger>
                    <SelectContent style={S.content}>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="purple">Purple</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="orange">Orange</SelectItem>
                      <SelectItem value="pink">Pink</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator style={S.separator} />

                {/* Font size */}
                <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex size-9 shrink-0 items-center justify-center "
                      style={S.iconBox}
                    >
                      <Type className="size-4" style={S.icon} />
                    </div>
                    <div className="min-w-0">
                      <Label
                        htmlFor="setting-font-size"
                        className="text-sm font-medium"
                        style={S.label}
                      >
                        Font size
                      </Label>
                      <p className="mt-1 text-xs" style={S.sub}>
                        Adjust the text size in your workspace.
                      </p>
                    </div>
                  </div>

                  <Select
                    value={settings.font_size ?? ""}
                    onValueChange={(value) => update("font_size", value)}
                  >
                    <SelectTrigger
                      id="setting-font-size"
                      className="w-full sm:w-40"
                      style={S.trigger}
                    >
                      <SelectValue placeholder="Select size" className="capitalize" />
                    </SelectTrigger>
                    <SelectContent style={S.content}>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Editor */}
          <section className="space-y-4">
            <div>
              <h2 className="text-base font-semibold" style={S.heading}>
                Editor
              </h2>
              <p className="mt-1 text-sm" style={S.sub}>
                Configure your writing experience.
              </p>
            </div>

            <Card className="overflow-hidden  shadow-none" style={S.card}>
              <CardContent className="p-0">
                {/* Auto save */}
                <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex size-9 shrink-0 items-center justify-center"
                      style={S.iconBox}
                    >
                      <Save className="size-4" style={S.icon} />
                    </div>
                    <div className="min-w-0">
                      <Label
                        htmlFor="setting-auto-save"
                        className="cursor-pointer text-sm font-medium"
                        style={S.label}
                      >
                        Auto save
                      </Label>
                      <p className="mt-1 text-xs" style={S.sub}>
                        Automatically save your changes.
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="setting-auto-save"
                    style={{backgroundColor:COLORS.accent}}

                    checked={Boolean(settings.auto_save)}
                    onCheckedChange={(value) => update("auto_save", value)}
                  />
                </div>

                <Separator style={S.separator} />

                {/* Spell check */}
                <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex size-9 shrink-0 items-center justify-center"
                      style={S.iconBox}
                    >
                      <SpellCheck className="size-4" style={S.icon} />
                    </div>
                    <div className="min-w-0">
                      <Label
                        htmlFor="setting-spell-check"
                        className="cursor-pointer text-sm font-medium"
                        style={S.label}
                      >
                        Spell check
                      </Label>
                      <p className="mt-1 text-xs" style={S.sub}>
                        Check spelling while writing.
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="setting-spell-check"
                    style={{backgroundColor:COLORS.accent}}

                    checked={Boolean(settings.spell_check)}
                    onCheckedChange={(value) => update("spell_check", value)}
                  />
                </div>

                <Separator style={S.separator} />

                {/* Word wrap */}
                <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex size-9 shrink-0 items-center justify-center"
                      style={S.iconBox}
                    >
                      <WrapText className="size-4" style={S.icon} />
                    </div>
                    <div className="min-w-0">
                      <Label
                        htmlFor="setting-word-wrap"
                        className="cursor-pointer text-sm font-medium"
                        style={S.label}
                      >
                        Word wrap
                      </Label>
                      <p className="mt-1 text-xs" style={S.sub}>
                        Wrap long lines automatically.
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="setting-word-wrap"
                    checked={Boolean(settings.word_wrap)}
                    style={{backgroundColor:COLORS.accent}}
                    onCheckedChange={(value) => update("word_wrap", value)}
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Notes */}
          <section className="space-y-4">
            <div>
              <h2 className="text-base font-semibold" style={S.heading}>
                Notes
              </h2>
              <p className="mt-1 text-sm" style={S.sub}>
                Manage your note display and deleted notes.
              </p>
            </div>

            <Card className="overflow-hidden  shadow-none" style={S.card}>
              <CardContent className="p-0">
                {/* Default view */}
                <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex size-9 shrink-0 items-center justify-center "
                      style={S.iconBox}
                    >
                      <LayoutGrid className="size-4" style={S.icon} />
                    </div>
                    <div className="min-w-0">
                      <Label
                        htmlFor="setting-default-view"
                        className="text-sm font-medium"
                        style={S.label}
                      >
                        Default view
                      </Label>
                      <p className="mt-1 text-xs" style={S.sub}>
                        Choose how your notes are displayed.
                      </p>
                    </div>
                  </div>

                  <Select
                    value={settings.default_view ?? ""}
                    onValueChange={(value) => update("default_view", value)}
                  >
                    <SelectTrigger
                      id="setting-default-view"
                      className="w-full sm:w-40"
                      style={S.trigger}
                    >
                      <SelectValue placeholder="Select view" className="capitalize" />
                    </SelectTrigger>
                    <SelectContent
                      style={{
                        backgroundColor: COLORS.bgPrimary,
                        color: COLORS.textPrimary,
                      }}
                    >
                      <SelectItem value="list">
                        <span className="flex items-center gap-2">
                          <List className="size-4" />
                          List
                        </span>
                      </SelectItem>
                      <SelectItem value="grid">
                        <span className="flex items-center gap-2">
                          <LayoutGrid className="size-4" />
                          Grid
                        </span>
                      </SelectItem>
                      <SelectItem value="compact">Compact</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator style={S.separator} />

                {/* Restore notes */}
                <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex size-9 shrink-0 items-center justify-center lg"
                      style={S.iconBox}
                    >
                      <RotateCcw className="size-4" style={S.icon} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium" style={S.label}>
                        Restore deleted notes
                      </p>
                      <p className="mt-1 text-xs" style={S.sub}>
                        Recover notes from your trash.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    style={S.outlineBtn}
                    onClick={restoreNotes}
                    disabled={isRestoring}
                  >
                    {isRestoring ? (
                      <>
                        <LoaderCircle className="mr-2 size-4 animate-spin" />
                        Restoring
                      </>
                    ) : (
                      "Restore"
                    )}
                  </Button>
                </div>

                <Separator style={S.separator} />

                {/* Empty trash */}
                <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center lg bg-destructive/10">
                      <Trash2 className="size-4 text-destructive" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-destructive">
                        Empty trash
                      </p>
                      <p className="mt-1 text-xs" style={S.sub}>
                        Permanently delete trashed notes.
                      </p>
                    </div>
                  </div>

                  <AlertDialog
                    open={deleteDialogOpen}
                    onOpenChange={(open) => {
                      if (!isDeleting) {
                        setDeleteDialogOpen(open);
                      }
                    }}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={isDeleting}
                      >
                        Empty trash
                      </Button>
                    </AlertDialogTrigger>

                    <AlertDialogContent style={S.dialog}>
                      <AlertDialogHeader>
                        <AlertDialogTitle style={S.heading}>
                          Permanently delete notes?
                        </AlertDialogTitle>
                        <AlertDialogDescription style={S.sub}>
                          This action cannot be undone. All notes affected by
                          your deleteAllNotes service may be permanently
                          removed. Continue only if you are sure.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel
                          disabled={isDeleting}
                          style={S.outlineBtn}
                        >
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          disabled={isDeleting}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={(event) => {
                            event.preventDefault();
                            emptyTrash();
                          }}
                        >
                          {isDeleting ? (
                            <>
                              <LoaderCircle className="mr-2 size-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            "Delete permanently"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* About */}
          <section className="space-y-4">
            <div>
              <h2 className="text-base font-semibold" style={S.heading}>
                About
              </h2>
              <p className="mt-1 text-sm" style={S.sub}>
                Application information.
              </p>
            </div>

            <Card className="xl shadow-none" style={S.card}>
              <CardContent className="flex items-center gap-3 p-4 sm:p-5">
                <div
                  className="flex size-9 shrink-0 items-center justify-center lg"
                  style={S.iconBox}
                >
                  <Info className="size-4" style={S.icon} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium" style={S.label}>
                    Application version
                  </p>
                  <p className="mt-1 text-xs" style={S.sub}>
                    Your currently installed version.
                  </p>
                </div>
                <span
                  className="md  px-2.5 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: COLORS.bgHover,
                    color: COLORS.textPrimary,
                  }}
                >
                  {(version ?? "Unknown")}
                </span>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}