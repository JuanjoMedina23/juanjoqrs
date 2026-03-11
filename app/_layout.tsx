import { Stack } from "expo-router";
import { ThemeProvider } from "@/context/ThemeContext";
import { CheckoutProvider } from "@/context/CheckoutContext";

export default function RootLayout() {
  useEffect(() => {
    const setupNotifications = async () => {
      // 📱 Pedir permisos
      await Notifications.requestPermissionsAsync();

      // 🤖 Android necesita canal
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          sound: "default",
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#2196F3",
        });
      }
    };

    setupNotifications();
  }, []);

  return (
    <ThemeProvider>
      <CheckoutProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </CheckoutProvider>
    </ThemeProvider>
  );
}