import { useEffect } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { Slot, useRouter, useSegments } from "expo-router";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider, useAuthContext } from "@/context/AuthContext";
import { CheckoutProvider } from "@/context/CheckoutContext";

function RootNavigator() {
  const { session, loading } = useAuthContext();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments.includes("(auth)");

    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      router.replace("/");
    }
  }, [session, loading, segments]);

  return <Slot />;
}

export default function RootLayout() {
  useEffect(() => {
    const setupNotifications = async () => {
      await Notifications.requestPermissionsAsync();

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
        <CheckoutProvider>
          <RootNavigator />
        </CheckoutProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}