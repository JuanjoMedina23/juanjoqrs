import { router } from "expo-router";
import { HomeView } from "../components/home/HomeScreen";

export default function Index() {

  const handleGoToScanner = () => {
    router.push("/(checkout)/scanner");
  };

  const handleOpenSettings = () => {
    router.push("/settings");
  };

  return (
    <HomeView
      onScanPress={handleGoToScanner}
      onSettingsPress={handleOpenSettings}
    />
  );
}