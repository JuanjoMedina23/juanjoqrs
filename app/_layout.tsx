import { Stack } from "expo-router";
import { ThemeProvider } from "@/context/ThemeContext";
import { CheckoutProvider } from "@/context/CheckoutContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <CheckoutProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </CheckoutProvider>
    </ThemeProvider>
  );
}