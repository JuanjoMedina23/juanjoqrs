import { StyleSheet } from "react-native";
import { ThemeType } from "../../lib/themes/theme";

export const createAuthStyles = (theme: ThemeType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    logoContainer: {
      alignItems: "center",
      marginBottom: 40,
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: theme.text,
      textAlign: "center",
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: theme.text,
      opacity: 0.6,
      textAlign: "center",
      marginBottom: 32,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 24,
      gap: 16,
    },
    inputWrapper: {
      gap: 6,
    },
    label: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.text,
      opacity: 0.8,
    },
    input: {
      backgroundColor: theme.background,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: theme.text,
      borderWidth: 1,
      borderColor: theme.card,
    },
    inputFocused: {
      borderColor: "#3b82f6",
    },
    button: {
      backgroundColor: "#3b82f6",
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 8,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
    },
    switchText: {
      textAlign: "center",
      color: theme.text,
      opacity: 0.6,
      fontSize: 14,
      marginTop: 16,
    },
    switchLink: {
      color: "#3b82f6",
      fontWeight: "600",
      opacity: 1,
    },
    errorText: {
      color: "#ef4444",
      fontSize: 13,
      textAlign: "center",
    },
    successText: {
      color: "#22c55e",
      fontSize: 13,
      textAlign: "center",
    },
  });