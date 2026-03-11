import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";

export default function ConfirmScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.replace("/(auth)/login");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
    },
    iconContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: "#22c55e18",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 32,
    },
    iconText: {
      fontSize: 48,
    },
    title: {
      fontSize: 26,
      fontWeight: "700",
      color: theme.text,
      textAlign: "center",
      marginBottom: 12,
    },
    subtitle: {
      fontSize: 15,
      color: theme.text,
      opacity: 0.6,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 40,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 24,
      width: "100%",
      alignItems: "center",
      gap: 16,
    },
    countdownContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    countdownText: {
      fontSize: 13,
      color: theme.text,
      opacity: 0.5,
    },
    countdownNumber: {
      fontSize: 13,
      color: "#3b82f6",
      fontWeight: "700",
      opacity: 1,
    },
    button: {
      backgroundColor: "#3b82f6",
      borderRadius: 10,
      paddingVertical: 14,
      paddingHorizontal: 32,
      alignItems: "center",
      width: "100%",
    },
    buttonText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
    },
    divider: {
      width: "100%",
      height: 1,
      backgroundColor: theme.text,
      opacity: 0.1,
    },
    secondaryButton: {
      paddingVertical: 8,
    },
    secondaryText: {
      fontSize: 14,
      color: theme.text,
      opacity: 0.5,
    },
    secondaryLink: {
      color: "#3b82f6",
      fontWeight: "600",
      opacity: 1,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>✅</Text>
      </View>

      <Text style={styles.title}>¡Cuenta verificada!</Text>
      <Text style={styles.subtitle}>
        Tu cuenta ha sido creada y verificada exitosamente. Ya puedes iniciar
        sesión y comenzar a usar la app.
      </Text>

      <View style={styles.card}>
        <View style={styles.countdownContainer}>
          <ActivityIndicator size="small" color="#3b82f6" />
          <Text style={styles.countdownText}>
            Redirigiendo en{" "}
            <Text style={styles.countdownNumber}>{countdown}s</Text>
          </Text>
        </View>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/(auth)/login")}
        >
          <Text style={styles.buttonText}>Iniciar sesión ahora</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.replace("/(auth)/register")}
        >
          <Text style={styles.secondaryText}>
            ¿Cuenta equivocada?{" "}
            <Text style={styles.secondaryLink}>Regístrate de nuevo</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}