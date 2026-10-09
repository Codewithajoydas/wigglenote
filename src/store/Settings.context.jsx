import { createContext, useEffect, useState } from "react";
import getSettings from "../services/settings/getSettings.services";
// eslint-disable-next-line react-refresh/only-export-components
export const SettingsContext = createContext();

export default function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({});
  useEffect(() => {
    (async () => {
      const settings = await getSettings();
      setSettings(settings);
    })();
  }, []);
  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
