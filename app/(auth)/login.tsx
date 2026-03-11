import React from "react";
import { useRouter } from "expo-router";
import LoginView from "../../components/auth/LoginView";

export default function LoginScreen() {
  const router = useRouter();
  return (
    <LoginView
      onNavigateToRegister={() => router.push("/(auth)/register")}
    />
  );
}