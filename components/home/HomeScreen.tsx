import { useRef, useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, Animated, ScrollView,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Settings, QrCode, X, Plus } from "lucide-react-native";
import QRCode from "react-native-qrcode-svg";
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
  "Genera un QR de cobro para recibir pagos de otros usuarios.",
];

type Props = {
  onScanPress: () => void;
  onSettingsPress: () => void;
};

export const HomeView = ({ onScanPress, onSettingsPress }: Props) => {
  const { theme, mode } = useTheme();
  const { user } = useAuthContext();
  const [profileName, setProfileName] = useState<string | null>(null);

  const [showQRModal, setShowQRModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [qrValue, setQrValue] = useState<string | null>(null);

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

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
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

  const tip = TIPS[new Date().getDate() % TIPS.length];

  const gradientColors =
    mode === "dark"
      ? ["#0f172a", "#1e293b"] as const
      : ["#f8fafc", "#ede9fe"] as const;

  const handleGenerateQR = () => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return;
    // QR contiene monto + userId del cobrador
    setQrValue(JSON.stringify({ amount: parsed.toFixed(2), userId: user?.id }));
  };

  const handleCloseModal = () => {
    setShowQRModal(false);
    setAmount("");
    setQrValue(null);
  };

  return (
    <LinearGradient colors={gradientColors} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Animated.View style={{
          opacity: fadeAnim, transform: [{ translateY: slideAnim }],
          flexDirection: "row", justifyContent: "space-between", alignItems: "center",
          paddingTop: 60, paddingHorizontal: 24, marginBottom: 40,
        }}>
          <View>
            <Text style={{ fontSize: 14, color: theme.text, opacity: 0.5, fontWeight: "500" }}>{getGreeting()},</Text>
            <Text style={{ fontSize: 26, fontWeight: "800", color: theme.text }}>{displayName} 👋</Text>
          </View>
          <TouchableOpacity
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.card, justifyContent: "center", alignItems: "center", elevation: 2 }}
            onPress={onSettingsPress}
          >
            <Settings size={20} color={theme.text} />
          </TouchableOpacity>
        </Animated.View>

        {/* Logo + nombre */}
        <Animated.View style={{ opacity: cardAnim, transform: [{ translateY: cardSlide }], alignItems: "center", flex: 1, justifyContent: "center", paddingHorizontal: 24, gap: 12 }}>
          <View style={{ width: 96, height: 96, borderRadius: 28, backgroundColor: PRIMARY, justifyContent: "center", alignItems: "center", elevation: 10, shadowColor: PRIMARY, shadowOpacity: 0.45, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, marginBottom: 8 }}>
            <QrCode size={48} color="#fff" />
          </View>
          <Text style={{ fontSize: 32, fontWeight: "800", color: theme.text, letterSpacing: -1 }}>JuanjoQRs</Text>
          <Text style={{ fontSize: 15, color: theme.text, opacity: 0.5, textAlign: "center" }}>Tu app de pagos con QR</Text>

          {/* Tip del día */}
          <View style={{ backgroundColor: theme.card, borderRadius: 18, padding: 16, marginTop: 24, width: "100%", flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
            <Text style={{ fontSize: 22 }}>💡</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: PRIMARY, marginBottom: 4, letterSpacing: 0.5 }}>TIP DEL DÍA</Text>
              <Text style={{ fontSize: 14, color: theme.text, opacity: 0.7, lineHeight: 20 }}>{tip}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Botones */}
        <Animated.View style={{ opacity: btnAnim, marginHorizontal: 24, marginTop: 40, gap: 12 }}>
          <TouchableOpacity
            style={{ backgroundColor: PRIMARY, paddingVertical: 18, borderRadius: 20, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10, elevation: 6, shadowColor: PRIMARY, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}
            onPress={onScanPress} activeOpacity={0.9}
          >
            <QrCode size={24} color="#fff" />
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#fff" }}>Escanear QR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ backgroundColor: theme.card, paddingVertical: 18, borderRadius: 20, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10, elevation: 2 }}
            onPress={() => setShowQRModal(true)} activeOpacity={0.9}
          >
            <Plus size={24} color={PRIMARY} />
            <Text style={{ fontSize: 18, fontWeight: "700", color: PRIMARY }}>Generar QR de cobro</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Modal QR */}
      <Modal visible={showQRModal} transparent animationType="slide" onRequestClose={handleCloseModal}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
            <View style={{ backgroundColor: theme.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, gap: 20 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 20, fontWeight: "800", color: theme.text }}>Generar QR de cobro</Text>
                <TouchableOpacity style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.background, justifyContent: "center", alignItems: "center" }} onPress={handleCloseModal}>
                  <X size={18} color={theme.text} />
                </TouchableOpacity>
              </View>

              {!qrValue ? (
                <>
                  <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: theme.background, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, gap: 8 }}>
                    <Text style={{ fontSize: 24, fontWeight: "700", color: PRIMARY }}>$</Text>
                    <TextInput
                      style={{ flex: 1, fontSize: 28, fontWeight: "800", color: theme.text }}
                      placeholder="0.00"
                      placeholderTextColor={`${theme.text}40`}
                      keyboardType="decimal-pad"
                      value={amount}
                      onChangeText={setAmount}
                      autoFocus
                    />
                  </View>
                  <TouchableOpacity
                    style={{ backgroundColor: parseFloat(amount) > 0 ? PRIMARY : `${PRIMARY}60`, paddingVertical: 16, borderRadius: 16, alignItems: "center" }}
                    onPress={handleGenerateQR}
                    disabled={!amount || parseFloat(amount) <= 0}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Generar QR</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={{ alignItems: "center", gap: 16 }}>
                    <Text style={{ fontSize: 14, color: theme.text, opacity: 0.5 }}>
                      Muestra este código para recibir el pago
                    </Text>
                    <View style={{ backgroundColor: "#fff", padding: 20, borderRadius: 20, elevation: 4, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }}>
                      <QRCode value={qrValue} size={200} color="#0f172a" backgroundColor="#fff" />
                    </View>
                    <Text style={{ fontSize: 36, fontWeight: "800", color: theme.text, letterSpacing: -1 }}>
                      ${parseFloat(amount).toFixed(2)}
                    </Text>
                    <Text style={{ fontSize: 13, color: TEXT_SECONDARY }}>
                      El pago se acreditará en tu cuenta
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={{ backgroundColor: theme.background, paddingVertical: 16, borderRadius: 16, alignItems: "center" }}
                    onPress={() => { setQrValue(null); setAmount(""); }}
                  >
                    <Text style={{ color: theme.text, fontWeight: "600", fontSize: 15 }}>Generar otro</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </LinearGradient>
  );
};

const TEXT_SECONDARY = "#64748b";