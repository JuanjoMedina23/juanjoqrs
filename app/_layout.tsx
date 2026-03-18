import { useEffect } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as NavigationBar from "expo-navigation-bar";
import * as Linking from "expo-linking";
import { StatusBar } from "expo-status-bar";
import { Slot, useRouter, useSegments } from "expo-router";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider, useAuthContext } from "@/context/AuthContext";
import { CheckoutProvider } from "@/context/CheckoutContext";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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

  // Deep link handler para verificación de email
  useEffect(() => {
    const handleDeepLink = (url: string) => {
      console.log("Deep link recibido:", url);
      const parsed = Linking.parse(url);
      console.log("Parsed:", JSON.stringify(parsed));
      const token = parsed.queryParams?.token_hash as string;
      const type = parsed.queryParams?.type as string;

      if (token && type) {
        router.push({
          pathname: "/(auth)/confirm",
          params: { token, type },
        });
      }
    };

    // App abierta: escuchar link entrante
    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url);
    });

    // App cerrada: leer link inicial
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    return () => subscription.remove();
  }, []);

  return <Slot />;
}

export default function RootLayout() {
  useEffect(() => {
    const setup = async () => {
      await Notifications.requestPermissionsAsync();

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          sound: "default",
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#2196F3",
        });

        await NavigationBar.setVisibilityAsync("hidden");
        await NavigationBar.setBehaviorAsync("overlay-swipe");
      }
    };

    setup();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <CheckoutProvider>
          <StatusBar hidden />
          <RootNavigator />
        </CheckoutProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}