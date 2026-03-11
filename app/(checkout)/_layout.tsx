import { ThemeProvider } from "@/context/ThemeContext";
import { CheckoutProvider } from "@/context/CheckoutContext";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <CheckoutProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </CheckoutProvider>
    </ThemeProvider>
  );
}