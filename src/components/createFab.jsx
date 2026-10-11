import { useContext, useMemo } from "react";
import { Plus, Save, Pen } from "lucide-react";
import { SettingsContext } from "../store/Settings.context";
import { getThemeColors } from "../constants/Theme";
import { Button } from "./ui/button";

export default function CreateFab({ onClick = () => {}, title = "create" }) {
  const isSave = title.toLocaleLowerCase() === "save";
  const isEdit = title.toLocaleLowerCase() === "edit";

  const { settings } = useContext(SettingsContext);
  const COLORS = useMemo(
    () => getThemeColors(settings.theme, settings.accent_color),
    [settings.theme, settings.accent_color],
  );

  return (
    <Button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50  cursor-pointer"
      style={{ backgroundColor: COLORS.accent, color: "#ffffff" }}
      onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.15)")}
      onMouseLeave={(e) => (e.currentTarget.style.filter = "brightness(1)")}
    >
      {isSave ? (
        <Save size={16} />
      ) : isEdit ? (
        <Pen size={16} />
      ) : (
        <Plus size={16} />
      )}
      <span className="text-sm font-medium">
        {isSave ? "Save Note" : isEdit ? "Edit Note" : "New Note"}
      </span>
    </Button>
  );
}
