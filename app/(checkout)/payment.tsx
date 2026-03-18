import { useState, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Animated, Dimensions,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { CheckCircle, XCircle, ArrowLeft, Wallet } from "lucide-react-native";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@/context/ThemeContext";
import { useAuthContext } from "@/context/AuthContext";
import { useCheckout } from "@/context/CheckoutContext";
import { supabase } from "@/lib/core/auth/supabaseClient";
import * as Notifications from "expo-notifications";

const PRIMARY = "#6C63FF";
const TEXT_SECONDARY = "#64748b";
const BORDER = "#e2e8f0";
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CONFETTI_COLORS = ["#6C63FF", "#22C55E", "#F59E0B", "#EF4444", "#3B82F6", "#EC4899"];
const CONFETTI_COUNT = 60;

type Status = "confirming" | "loading" | "success" | "error";

interface ConfettiPiece {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  opacity: Animated.Value;
  color: string;
  size: number;
  startX: number;
}

async function sendPaymentNotification(amount: number, newBalance: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "💳 Pago registrado",
      body: `Se ha registrado un pago de $${amount.toFixed(2)}. Saldo restante: $${newBalance.toFixed(2)}`,
      sound: true,
    },
    trigger: null,
  });
}

async function savePaymentMarker(userId: string, amount: number, date: string) {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const { latitude, longitude } = loc.coords;
    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
    const locationLabel = place?.street
      ? `${place.street}${place.streetNumber ? " " + place.streetNumber : ""}`
      : place?.city ?? place?.region ?? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    const formattedDate = new Date(date).toLocaleDateString("es-ES", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    });
    const marker = {
      id: Date.now().toString(),
      lat: latitude, lng: longitude,
      label: `💳 $${amount.toFixed(2)} — ${locationLabel} (${formattedDate})`,
      category: "visitado",
    };
    const STORAGE_KEY = `map_markers_${userId}`;
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const existing = stored ? JSON.parse(stored) : [];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([marker, ...existing]));
  } catch (e) {}
}

function useConfetti(active: boolean) {
  const pieces = useRef<ConfettiPiece[]>(
    Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
      id: i,
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      rotation: new Animated.Value(0),
      opacity: new Animated.Value(1),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: Math.random() * 8 + 6,
      startX: Math.random() * SCREEN_WIDTH,
    }))
  ).current;

  useEffect(() => {
    if (!active) return;
    pieces.forEach((p) => {
      p.x.setValue(p.startX); p.y.setValue(-20);
      p.rotation.setValue(0); p.opacity.setValue(1);
      Animated.parallel([
        Animated.timing(p.y, { toValue: SCREEN_HEIGHT + 50, duration: 2000 + Math.random() * 1000, useNativeDriver: true }),
        Animated.timing(p.x, { toValue: p.startX + (Math.random() - 0.5) * 200, duration: 2000 + Math.random() * 1000, useNativeDriver: true }),
        Animated.timing(p.rotation, { toValue: Math.random() * 720 - 360, duration: 2000 + Math.random() * 1000, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(1500),
          Animated.timing(p.opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]),
      ]).start();
    });
  }, [active]);
  return pieces;
}

export default function PaymentScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { theme } = useTheme();
  const { user } = useAuthContext();
  const { balance, pay, refetch } = useCheckout();

  const [status, setStatus] = useState<Status>("confirming");
  const [errorMsg, setErrorMsg] = useState("");
  const [newBalance, setNewBalance] = useState(0);
  const [receiverName, setReceiverName] = useState<string | null>(null);

  // Parsear el QR
  let amount = 0;
  let receiverId: string | null = null;
  try {
    const parsed = JSON.parse(code ?? "");
    amount = parseFloat(parsed.amount);
    receiverId = parsed.userId ?? null;
  } catch {
    amount = parseFloat(code ?? "");
  }
  const isValidAmount = !isNaN(amount) && amount > 0;

  const confettiPieces = useConfetti(status === "success");

  // Cargar nombre del cobrador si hay receiverId
  useEffect(() => {
    if (!receiverId) return;
    const loadReceiver = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", receiverId)
        .single();
      if (data) setReceiverName(data.full_name ?? data.email?.split("@")[0] ?? "Usuario");
    };
    loadReceiver();
  }, [receiverId]);

  const handlePay = async () => {
    setStatus("loading");
    const result = await pay(code ?? "");
    if (result.success) {
      await refetch();
      const nb = balance - amount;
      setNewBalance(nb);
      setStatus("success");
      const now = new Date().toISOString();
      await Promise.all([
        sendPaymentNotification(amount, nb),
        savePaymentMarker(user?.id ?? "guest", amount, now),
      ]);
    } else {
      setErrorMsg(result.error ?? "Error desconocido.");
      setStatus("error");
    }
  };

  const handleBack = () => router.replace("/");
  const handleGoWallet = () => router.replace("/(tabs)/wallet");
  const s = styles(theme);

  if (status === "confirming") {
    return (
      <View style={s.container}>
        <View style={s.card}>
          <Text style={s.label}>Pago detectado</Text>
          <Text style={s.amount}>{isValidAmount ? `$${amount.toFixed(2)}` : "QR inválido"}</Text>
          {receiverName && (
            <Text style={[s.label, { color: PRIMARY }]}>Para: {receiverName}</Text>
          )}
          <View style={s.balanceRow}>
            <Wallet size={16} color={TEXT_SECONDARY} />
            <Text style={s.balanceText}>Saldo disponible: ${balance.toFixed(2)}</Text>
          </View>
          {!isValidAmount && <Text style={s.errorText}>Este QR no contiene un monto válido.</Text>}
          <TouchableOpacity
            style={[s.btn, s.btnPrimary, !isValidAmount && s.btnDisabled]}
            onPress={handlePay} disabled={!isValidAmount}
          >
            <Text style={s.btnPrimaryText}>Confirmar pago</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, s.btnSecondary]} onPress={handleBack}>
            <ArrowLeft size={16} color={theme.text} />
            <Text style={[s.btnSecondaryText, { color: theme.text }]}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (status === "loading") {
    return (
      <View style={s.container}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={[s.label, { marginTop: 16 }]}>Procesando pago...</Text>
      </View>
    );
  }

  if (status === "success") {
    return (
      <View style={s.container}>
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          {confettiPieces.map((p) => (
            <Animated.View key={p.id} style={{
              position: "absolute", width: p.size, height: p.size,
              backgroundColor: p.color, borderRadius: p.size / 4,
              transform: [
                { translateX: p.x }, { translateY: p.y },
                { rotate: p.rotation.interpolate({ inputRange: [-360, 360], outputRange: ["-360deg", "360deg"] }) },
              ],
              opacity: p.opacity,
            }} />
          ))}
        </View>
        <View style={s.card}>
          <CheckCircle size={64} color="#22C55E" />
          <Text style={s.successTitle}>¡Pago exitoso!</Text>
          <Text style={s.amount}>${amount.toFixed(2)}</Text>
          {receiverName && <Text style={[s.label, { color: PRIMARY }]}>Enviado a: {receiverName}</Text>}
          <Text style={s.balanceText}>Nuevo saldo: ${newBalance.toFixed(2)}</Text>
          <Text style={[s.label, { fontSize: 12 }]}>📍 Ubicación guardada en el mapa</Text>
          <TouchableOpacity style={[s.btn, s.btnPrimary, { marginTop: 16 }]} onPress={handleGoWallet}>
            <Wallet size={16} color="#fff" />
            <Text style={s.btnPrimaryText}>Ver wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, s.btnSecondary]} onPress={handleBack}>
            <Text style={[s.btnSecondaryText, { color: theme.text }]}>Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.card}>
        <XCircle size={64} color="#EF4444" />
        <Text style={s.errorTitle}>Pago fallido</Text>
        <Text style={s.errorText}>{errorMsg}</Text>
        <TouchableOpacity style={[s.btn, s.btnPrimary, { marginTop: 24 }]} onPress={() => setStatus("confirming")}>
          <Text style={s.btnPrimaryText}>Reintentar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, s.btnSecondary]} onPress={handleBack}>
          <Text style={[s.btnSecondaryText, { color: theme.text }]}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background, justifyContent: "center", alignItems: "center", padding: 24 },
    card: { width: "100%", backgroundColor: theme.card, borderRadius: 24, padding: 28, alignItems: "center", gap: 12, elevation: 6, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
    label: { fontSize: 14, color: TEXT_SECONDARY, fontWeight: "500" },
    amount: { fontSize: 48, fontWeight: "800", color: theme.text, letterSpacing: -1 },
    balanceRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    balanceText: { fontSize: 14, color: TEXT_SECONDARY },
    successTitle: { fontSize: 22, fontWeight: "700", color: "#22C55E" },
    errorTitle: { fontSize: 22, fontWeight: "700", color: "#EF4444" },
    errorText: { fontSize: 14, color: "#EF4444", textAlign: "center" },
    btn: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14 },
    btnPrimary: { backgroundColor: PRIMARY },
    btnPrimaryText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    btnSecondary: { borderWidth: 1, borderColor: BORDER },
    btnSecondaryText: { fontWeight: "600", fontSize: 15 },
    btnDisabled: { opacity: 0.4 },
  });