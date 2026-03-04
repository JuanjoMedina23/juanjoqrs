import { StyleSheet } from "react-native";
import { ThemeType } from "../../lib/themes/theme";

export const createStyles = (theme: ThemeType) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },

    header: {
      paddingTop: 60,
      paddingHorizontal: 24,
      alignItems: "flex-end",
    },

    settingsButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.card,
      justifyContent: "center",
      alignItems: "center",
    },

    main: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
    },

    textContainer: {
      alignItems: "center",
      marginBottom: 60,
    },

    title: {
      fontSize: 40,
      fontWeight: "700",
      color: theme.text,
    },

    subtitle: {
      fontSize: 16,
      color: theme.text,
      opacity: 0.6,
      marginTop: 6,
    },

    scanButton: {
      width: "100%",
      backgroundColor: "#0df20d",
      paddingVertical: 20,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 10,
    },

    scanText: {
      fontSize: 18,
      fontWeight: "700",
      color: "#0f172a",
    },

    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 20,
      gap: 6,
    },

    infoText: {
      color: theme.text,
      opacity: 0.5,
      fontSize: 14,
    },

    footer: {
      paddingBottom: 30,
      alignItems: "center",
    },

    homeIndicator: {
      width: 120,
      height: 6,
      borderRadius: 10,
      backgroundColor: theme.card,
      opacity: 0.6,
    },
  });