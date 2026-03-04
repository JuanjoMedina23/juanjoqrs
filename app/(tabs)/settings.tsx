import { SettingsView } from "@/components/settings/SettingsView";
import { useTheme } from "@/context/ThemeContext";
import { router } from "expo-router";

export default function Settings() {
  const { mode, setMode } = useTheme();


  const handlerGoback =() =>{
    router.back();
  };
  return (
    <SettingsView
      currentMode={mode}
      onChangeMode={setMode}
      onBackPress={handlerGoback}
    />
  );
}