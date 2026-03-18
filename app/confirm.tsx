import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { CheckCircle } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";

const PRIMARY = "#6C63FF";
const TEXT_SECONDARY = "#64748b";

export default function ConfirmScreen() {
  const { theme } = useTheme();
  const s = styles(theme);

  return (
    <View style={[s.container, s.centered]}>
      <View style={s.card}>
        <CheckCircle size={72} color="#22C55E" />
        <Text style={s.title}>¡Cuenta verificada!</Text>
        <Text style={s.subtitle}>
          Tu correo ha sido confirmado correctamente. Conoce todo lo que puedes hacer en JuanjoQRs.
        </Text>
        <TouchableOpacity
          style={s.btn}
          onPress={() => router.replace("/(auth)/onboarding")}
        >
          <Text style={s.btnText}>Continuar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      padding: 24,
    },
    centered: {
      justifyContent: "center",
      alignItems: "center",
    },
    card: {
      width: "100%",
      backgroundColor: theme.card,
      borderRadius: 24,
      padding: 32,
      alignItems: "center",
      gap: 16,
      elevation: 6,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    },
    title: {
      fontSize: 24,
      fontWeight: "800",
      color: theme.text,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 15,
      color: TEXT_SECONDARY,
      textAlign: "center",
      lineHeight: 22,
    },
    btn: {
      backgroundColor: PRIMARY,
      paddingVertical: 14,
      paddingHorizontal: 32,
      borderRadius: 14,
      marginTop: 8,
      width: "100%",
      alignItems: "center",
    },
    btnText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 16,
    },
  });