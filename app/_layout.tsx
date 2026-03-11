import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider, useAuthContext } from "@/context/AuthContext";

function RootNavigator() {
  const { session, loading } = useAuthContext();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace({ pathname: "/(auth)/login" });
    } else if (session && inAuthGroup) {
      router.replace({ pathname: "/" });
    }
  }, [session, loading, segments]);

  return <Slot />;
}

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
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}