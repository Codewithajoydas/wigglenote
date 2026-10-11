import { ArrowLeft } from "lucide-react";
import React, { useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { SettingsContext } from "../store/Settings.context";
import { getThemeColors } from "../constants/Theme";
import { Button } from "./ui/button";

export default function Header({ children, title }) {
  const navigate = useNavigate();
  const { settings } = useContext(SettingsContext);

  /** @type {ReturnType<typeof getThemeColors>} */
  const COLORS = useMemo(
    () => getThemeColors(settings.theme, settings.accent_color),
    [settings.theme, settings.accent_color],
  );

  return (
    <header
      className="sticky top-0 z-50 h-16 backdrop-blur-xl border-b"
      style={{
        backgroundColor: COLORS.bgSecondary,
        borderColor: COLORS.border,
        color: COLORS.textPrimary,
        WebkitAppRegion: "drag",
      }}
    >
      <div className="h-full px-5 flex items-center justify-between pr-37.5">
        {/* ── Left: back button + title ── */}
        <div
          className="flex items-center gap-3"
          style={{ WebkitAppRegion: "no-drag" }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            style={{
              WebkitAppRegion: "none",
              color: COLORS.textPrimary,
              cursor:"pointer",
              
              marginRight:3
            }}
          >
            <ArrowLeft size={24} />
            Back
          </Button>

          <div>
            <h4
              className="font-semibold text-sm tracking-wide"
              style={{ color: COLORS.textPrimary }}
            >
              {title}
            </h4>
            <p className="text-xs" style={{ color: COLORS.textSecondary }}>
              Wigglenote
            </p>
          </div>
        </div>

        {/* ── Right: action buttons (passed as children) ── */}
        <div
          className="flex items-center gap-2"
          style={{ WebkitAppRegion: "no-drag" }}
        >
          {children}
        </div>
      </div>
    </header>
  );
}
