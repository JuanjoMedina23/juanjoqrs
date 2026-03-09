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
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}