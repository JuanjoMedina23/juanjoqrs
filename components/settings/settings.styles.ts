import { StyleSheet } from "react-native";
import { ThemeType } from "../../lib/themes/theme";

export const createStyles = (theme: ThemeType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },

    title: {
      fontSize: 22,
      fontWeight: "700",
      marginBottom: 30,
      textAlign: "center",
      color: theme.text,
    },

    button: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingVertical: 16,
      borderRadius: 14,
      backgroundColor: theme.card,
      marginBottom: 16,
    },

    activeButton: {
      backgroundColor: "#0df20d",
    },

    buttonText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
    },

    activeText: {
      color: "#0f172a",
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 24,
      paddingHorizontal: 20,
      paddingTop: 60,
    },

    backButton: {
      padding: 8,
      marginRight: 12,
      borderRadius: 10,
    },

    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.text,
    },

    content: {
      flex: 1,
    },
  });