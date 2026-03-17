import React from "react";
import { useRouter } from "expo-router";
import RegisterView from "../../components/auth/RegisterView";

export default function RegisterScreen() {
  const router = useRouter();
  return (
    <RegisterView
      onNavigateToLogin={() => router.push("/(auth)/login")}
      onRegisterSuccess={() => router.replace("/(auth)/onboarding")}
    />
  );
}