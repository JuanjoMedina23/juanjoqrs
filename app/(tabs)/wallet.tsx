import { useRef, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Animated, Modal, TextInput, ActivityIndicator, Alert,
} from "react-native";
import { Wallet, ArrowDownCircle, ArrowUpCircle, ArrowDownLeft, Plus, BarChart2, X } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { useCheckout, Transaction } from "@/context/CheckoutContext";
import { useAuthContext } from "@/context/AuthContext";
import { router } from "expo-router";
import { WalletSkeleton } from "@/components/wallet/SkeletonWallet";  

const PRIMARY = "#6C63FF";
const TEXT_SECONDARY = "#64748b";

export default function WalletScreen() {
  const { theme } = useTheme();
  const { user } = useAuthContext();
  const { balance, history, loading, topUp, MAX_TOPUP } = useCheckout();

  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topping, setTopping] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(30)).current;
  const listAnim = useRef(new Animated.Value(0)).current;
  const listSlide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (loading) return;
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(cardSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(listAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(listSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, [loading]);

  const s = styles(theme);

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Error", "Ingresa un monto válido.");
      return;
    }
    setTopping(true);
    const result = await topUp(amount);
    setTopping(false);
    if (result.success) {
      setShowTopUpModal(false);
      setTopUpAmount("");
    } else {
      Alert.alert("Error", result.error ?? "No se pudo recargar.");
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("es-ES", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const getTransactionLabel = (item: Transaction) => {
    if (item.type === "topup") return "Recarga";
    if (item.type === "received") return "Cobro recibido";
    return "Pago QR";
  };

  const getTransactionColor = (item: Transaction) => {
    if (item.type === "topup" || item.type === "received") return "#22C55E";
    return "#EF4444";
  };

  const getTransactionPrefix = (item: Transaction) => {
    if (item.type === "topup" || item.type === "received") return "+";
    return "-";
  };

  const renderItem = ({ item }: { item: Transaction }) => {
    const isIncoming = item.type === "topup" || item.type === "received";
    return (
      <View style={s.txRow}>
        <View style={[s.txIcon, { backgroundColor: isIncoming ? "#DCFCE7" : "#FEE2E2" }]}>
          {item.type === "topup" ? (
            <ArrowDownCircle size={20} color="#22C55E" />
          ) : item.type === "received" ? (
            <ArrowDownLeft size={20} color="#22C55E" />
          ) : (
            <ArrowUpCircle size={20} color="#EF4444" />
          )}
        </View>
        <View style={s.txInfo}>
          <Text style={s.txType}>{getTransactionLabel(item)}</Text>
          <Text style={s.txDate}>{formatDate(item.date)}</Text>
        </View>
        <Text style={[s.txAmount, { color: getTransactionColor(item) }]}>
          {getTransactionPrefix(item)}${item.amount.toFixed(2)}
        </Text>
      </View>
    );
  };

  if (loading) return <WalletSkeleton />;

  return (
    <View style={s.container}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: cardSlide }] }}>
        <View style={s.balanceCard}>
          <View style={s.balanceHeader}>
            <Wallet size={22} color="#fff" />
            <Text style={s.balanceLabel}>Saldo disponible</Text>
          </View>
          <Text style={s.balanceAmount}>${balance.toFixed(2)}</Text>
          <View style={s.cardActions}>
            <TouchableOpacity style={s.topupBtn} onPress={() => setShowTopUpModal(true)}>
              <Plus size={16} color={PRIMARY} />
              <Text style={s.topupText}>Recargar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.statsBtn} onPress={() => router.push("/(tabs)/stats")}>
              <BarChart2 size={16} color="#fff" />
              <Text style={s.statsBtnText}>Estadísticas</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[s.historySection, { opacity: listAnim, transform: [{ translateY: listSlide }] }]}>
        <Text style={s.historyTitle}>Historial</Text>
        {history.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>📭</Text>
            <Text style={s.emptyText}>Sin movimientos aún.</Text>
            <Text style={s.emptySubtext}>Escanea un QR o recarga para empezar.</Text>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ gap: 10, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Animated.View>

      {/* Modal de recarga */}
      <Modal visible={showTopUpModal} transparent animationType="slide" onRequestClose={() => setShowTopUpModal(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={[s.modalCard, { backgroundColor: theme.card }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: theme.text }]}>Recargar saldo</Text>
              <TouchableOpacity style={[s.modalClose, { backgroundColor: theme.background }]} onPress={() => setShowTopUpModal(false)}>
                <X size={18} color={theme.text} />
              </TouchableOpacity>
            </View>

            <Text style={[s.modalSubtitle, { color: TEXT_SECONDARY }]}>
              Máximo por recarga: ${MAX_TOPUP}
            </Text>

            <View style={[s.amountRow, { backgroundColor: theme.background }]}>
              <Text style={{ fontSize: 24, fontWeight: "700", color: PRIMARY }}>$</Text>
              <TextInput
                style={[s.amountInput, { color: theme.text }]}
                placeholder="0.00"
                placeholderTextColor={`${theme.text}40`}
                keyboardType="decimal-pad"
                value={topUpAmount}
                onChangeText={setTopUpAmount}
                autoFocus
              />
            </View>

            {/* Atajos de monto */}
            <View style={s.shortcuts}>
              {[100, 250, 500, 1000].map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[s.shortcut, { backgroundColor: theme.background }]}
                  onPress={() => setTopUpAmount(v.toString())}
                >
                  <Text style={{ fontSize: 13, fontWeight: "600", color: PRIMARY }}>${v}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[s.confirmBtn, { backgroundColor: parseFloat(topUpAmount) > 0 ? PRIMARY : `${PRIMARY}60` }]}
              onPress={handleTopUp}
              disabled={topping || !topUpAmount || parseFloat(topUpAmount) <= 0}
            >
              {topping ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Confirmar recarga</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background, paddingHorizontal: 20, paddingTop: 60 },
    balanceCard: {
      backgroundColor: PRIMARY, borderRadius: 24, padding: 24, marginBottom: 28,
      elevation: 8, shadowColor: PRIMARY, shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
    },
    balanceHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
    balanceLabel: { color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: "500" },
    balanceAmount: { color: "#fff", fontSize: 52, fontWeight: "800", letterSpacing: -2, marginBottom: 20 },
    cardActions: { flexDirection: "row", gap: 10, alignItems: "center" },
    topupBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
    topupText: { color: PRIMARY, fontWeight: "700", fontSize: 14 },
    statsBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
    statsBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
    historySection: { flex: 1 },
    historyTitle: { fontSize: 18, fontWeight: "700", color: theme.text, marginBottom: 16 },
    txRow: { flexDirection: "row", alignItems: "center", backgroundColor: theme.card, borderRadius: 16, padding: 14, gap: 12 },
    txIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
    txInfo: { flex: 1 },
    txType: { fontSize: 15, fontWeight: "600", color: theme.text },
    txDate: { fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 },
    txAmount: { fontSize: 16, fontWeight: "700" },
    emptyState: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60, gap: 8 },
    emptyIcon: { fontSize: 48 },
    emptyText: { fontSize: 17, fontWeight: "600", color: theme.text },
    emptySubtext: { fontSize: 14, color: TEXT_SECONDARY, textAlign: "center" },
    modalCard: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, gap: 16 },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    modalTitle: { fontSize: 20, fontWeight: "800" },
    modalClose: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
    modalSubtitle: { fontSize: 13 },
    amountRow: { flexDirection: "row", alignItems: "center", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
    amountInput: { flex: 1, fontSize: 28, fontWeight: "800" },
    shortcuts: { flexDirection: "row", gap: 8 },
    shortcut: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center" },
    confirmBtn: { paddingVertical: 16, borderRadius: 16, alignItems: "center" },
  });