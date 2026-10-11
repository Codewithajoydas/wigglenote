import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import SettingsProvider from "./store/Settings.context.jsx";
import { TooltipProvider } from "./components/ui/tooltip";
// import { ContextMenu } from "./components/ui/context-menu";

createRoot(document.getElementById("root")).render(
  <SettingsProvider>
    <TooltipProvider>
      <App />
    </TooltipProvider>
  </SettingsProvider>,
);
