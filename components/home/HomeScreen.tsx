import { useRef, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Animated, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Settings, QrCode } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { useAuthContext } from "@/context/AuthContext";
import { supabase } from "@/lib/core/auth/supabaseClient";

const PRIMARY = "#6C63FF";

const TIPS = [
  "Escanea cualquier QR para realizar un pago al instante.",
  "Recarga tu saldo desde la pantalla Wallet cuando lo necesites.",
  "Guarda tus lugares favoritos en el mapa para encontrarlos fácil.",
  "Revisa tus estadísticas para llevar un control de tus gastos.",
  "Puedes cambiar el tema de la app desde Configuración.",
  "Tus datos se guardan de forma segura en tu cuenta.",
  "Filtra tus marcadores del mapa por categoría: favorito, visitado u otro.",
];

type Props = {
  onScanPress: () => void;
  onSettingsPress: () => void;
};

export const HomeView = ({ onScanPress, onSettingsPress }: Props) => {
  const { theme, mode } = useTheme();
  const { user } = useAuthContext();
  const [profileName, setProfileName] = useState<string | null>(null);

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(32)).current;
  const btnAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(cardSlide, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]),
      Animated.timing(btnAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  // Cargar nombre desde profiles de Supabase
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      if (data?.full_name) setProfileName(data.full_name.split(" ")[0]);
    };
    load();
  }, [user]);

  const displayName =
    profileName ??
    user?.user_metadata?.full_name?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "Usuario";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  // Tip del día basado en el día del mes
  const tip = TIPS[new Date().getDate() % TIPS.length];

  const gradientColors =
    mode === "dark"
      ? ["#0f172a", "#1e293b"] as const
      : ["#f8fafc", "#ede9fe"] as const;

  return (
    <LinearGradient colors={gradientColors} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 60,
            paddingHorizontal: 24,
            marginBottom: 40,
          }}
        >
          <View>
            <Text style={{ fontSize: 14, color: theme.text, opacity: 0.5, fontWeight: "500" }}>
              {getGreeting()},
            </Text>
            <Text style={{ fontSize: 26, fontWeight: "800", color: theme.text }}>
              {displayName} 👋
            </Text>
          </View>
          <TouchableOpacity
            style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: theme.card,
              justifyContent: "center", alignItems: "center",
              elevation: 2,
            }}
            onPress={onSettingsPress}
          >
            <Settings size={20} color={theme.text} />
          </TouchableOpacity>
        </Animated.View>

        {/* Centro: logo + nombre app */}
        <Animated.View
          style={{
            opacity: cardAnim,
            transform: [{ translateY: cardSlide }],
            alignItems: "center",
            flex: 1,
            justifyContent: "center",
            paddingHorizontal: 24,
            gap: 12,
          }}
        >
          <View style={{
            width: 96, height: 96, borderRadius: 28,
            backgroundColor: PRIMARY,
            justifyContent: "center", alignItems: "center",
            elevation: 10,
            shadowColor: PRIMARY,
            shadowOpacity: 0.45,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 8 },
            marginBottom: 8,
          }}>
            <QrCode size={48} color="#fff" />
          </View>

          <Text style={{ fontSize: 32, fontWeight: "800", color: theme.text, letterSpacing: -1 }}>
            JuanjoQRs
          </Text>
          <Text style={{ fontSize: 15, color: theme.text, opacity: 0.5, textAlign: "center" }}>
            Tu app de pagos con QR
          </Text>

          {/* Tip del día */}
          <View style={{
            backgroundColor: theme.card,
            borderRadius: 18,
            padding: 16,
            marginTop: 24,
            width: "100%",
            flexDirection: "row",
            gap: 12,
            alignItems: "flex-start",
          }}>
            <Text style={{ fontSize: 22 }}>💡</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: PRIMARY, marginBottom: 4, letterSpacing: 0.5 }}>
                TIP DEL DÍA
              </Text>
              <Text style={{ fontSize: 14, color: theme.text, opacity: 0.7, lineHeight: 20 }}>
                {tip}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Botón escanear */}
        <Animated.View
          style={{
            opacity: btnAnim,
            marginHorizontal: 24,
            marginTop: 40,
          }}
        >
          <TouchableOpacity
            style={{
              backgroundColor: PRIMARY,
              paddingVertical: 18,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 10,
              elevation: 6,
              shadowColor: PRIMARY,
              shadowOpacity: 0.4,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
            }}
            onPress={onScanPress}
            activeOpacity={0.9}
          >
            <QrCode size={24} color="#fff" />
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#fff" }}>
              Escanear QR
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
};