import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { CheckCircle, XCircle } from "lucide-react-native";
import { supabase } from "@/lib/core/auth/supabaseClient";
import { useTheme } from "@/context/ThemeContext";

const PRIMARY = "#6C63FF";
const TEXT_SECONDARY = "#64748b";

type Status = "loading" | "success" | "error";

export default function ConfirmScreen() {
  const { theme } = useTheme();
  const params = useLocalSearchParams();
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const s = styles(theme);

  useEffect(() => {
    const confirm = async () => {
      try {
        // Expo recibe el token via deep link en los params
        const token = params.token as string;
        const type = (params.type as string) ?? "signup";

        if (!token) {
          // Si no hay token puede que ya esté autenticado
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            setStatus("success");
          } else {
            setErrorMsg("No se encontró el token de verificación.");
            setStatus("error");
          }
          return;
        }

        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type === "signup" ? "signup" : "email",
        });

        if (error) throw error;
        setStatus("success");
      } catch (e: any) {
        setErrorMsg(e.message ?? "Error al verificar la cuenta.");
        setStatus("error");
      }
    };

    confirm();
  }, []);

  if (status === "loading") {
    return (
      <View style={[s.container, s.centered]}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={s.loadingText}>Verificando tu cuenta...</Text>
      </View>
    );
  }

  if (status === "success") {
    return (
      <View style={[s.container, s.centered]}>
        <View style={s.card}>
          <CheckCircle size={72} color="#22C55E" />
          <Text style={s.title}>¡Cuenta verificada!</Text>
          <Text style={s.subtitle}>
            Tu correo ha sido confirmado correctamente. Ya puedes iniciar sesión.
          </Text>
          <TouchableOpacity
            style={s.btn}
            onPress={() => router.replace("/(auth)/login")}
          >
            <Text style={s.btnText}>Ir al inicio de sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.container, s.centered]}>
      <View style={s.card}>
        <XCircle size={72} color="#EF4444" />
        <Text style={[s.title, { color: "#EF4444" }]}>Error de verificación</Text>
        <Text style={s.subtitle}>{errorMsg}</Text>
        <TouchableOpacity
          style={[s.btn, { backgroundColor: "#EF4444" }]}
          onPress={() => router.replace("/(auth)/login")}
        >
          <Text style={s.btnText}>Volver al login</Text>
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
    loadingText: {
      fontSize: 15,
      color: TEXT_SECONDARY,
      marginTop: 16,
    },
  });