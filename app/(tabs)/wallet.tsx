import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Wallet, ArrowDownCircle, ArrowUpCircle, Plus } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { useCheckout, Transaction } from "@/lib/modules/useCheckout";

const PRIMARY = "#6C63FF";
const TEXT_SECONDARY = "#64748b";

export default function WalletScreen() {
  const { theme } = useTheme();
  const { balance, history, loading, topUp, TOPUP_AMOUNT } = useCheckout();

  const s = styles(theme);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderItem = ({ item }: { item: Transaction }) => {
    const isPayment = item.type === "payment";
    return (
      <View style={s.txRow}>
        <View style={[s.txIcon, { backgroundColor: isPayment ? "#FEE2E2" : "#DCFCE7" }]}>
          {isPayment ? (
            <ArrowUpCircle size={20} color="#EF4444" />
          ) : (
            <ArrowDownCircle size={20} color="#22C55E" />
          )}
        </View>
        <View style={s.txInfo}>
          <Text style={s.txType}>{isPayment ? "Pago QR" : "Recarga"}</Text>
          <Text style={s.txDate}>{formatDate(item.date)}</Text>
        </View>
        <Text style={[s.txAmount, { color: isPayment ? "#EF4444" : "#22C55E" }]}>
          {isPayment ? "-" : "+"}${item.amount.toFixed(2)}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[s.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.balanceCard}>
        <View style={s.balanceHeader}>
          <Wallet size={22} color="#fff" />
          <Text style={s.balanceLabel}>Saldo disponible</Text>
        </View>
        <Text style={s.balanceAmount}>${balance.toFixed(2)}</Text>
        <TouchableOpacity style={s.topupBtn} onPress={topUp}>
          <Plus size={16} color={PRIMARY} />
          <Text style={s.topupText}>Recargar ${TOPUP_AMOUNT}</Text>
        </TouchableOpacity>
      </View>

      <View style={s.historySection}>
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
      </View>
    </View>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingHorizontal: 20,
      paddingTop: 60,
    },
    balanceCard: {
      backgroundColor: PRIMARY,
      borderRadius: 24,
      padding: 24,
      marginBottom: 28,
      elevation: 8,
      shadowColor: PRIMARY,
      shadowOpacity: 0.35,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
    },
    balanceHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 8,
    },
    balanceLabel: {
      color: "rgba(255,255,255,0.8)",
      fontSize: 14,
      fontWeight: "500",
    },
    balanceAmount: {
      color: "#fff",
      fontSize: 52,
      fontWeight: "800",
      letterSpacing: -2,
      marginBottom: 20,
    },
    topupBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "#fff",
      alignSelf: "flex-start",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
    },
    topupText: {
      color: PRIMARY,
      fontWeight: "700",
      fontSize: 14,
    },
    historySection: { flex: 1 },
    historyTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 16,
    },
    txRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 14,
      gap: 12,
    },
    txIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    txInfo: { flex: 1 },
    txType: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.text,
    },
    txDate: {
      fontSize: 12,
      color: TEXT_SECONDARY,
      marginTop: 2,
    },
    txAmount: {
      fontSize: 16,
      fontWeight: "700",
    },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 60,
      gap: 8,
    },
    emptyIcon: { fontSize: 48 },
    emptyText: {
      fontSize: 17,
      fontWeight: "600",
      color: theme.text,
    },
    emptySubtext: {
      fontSize: 14,
      color: TEXT_SECONDARY,
      textAlign: "center",
    },
  });