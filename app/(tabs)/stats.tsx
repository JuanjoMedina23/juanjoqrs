import { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Animated } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { useCheckout } from "@/context/CheckoutContext";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

const TEXT_SECONDARY = "#64748b";
const PRIMARY = "#6C63FF";
const { width } = Dimensions.get("window");
const DONUT_SIZE = width * 0.6;
const STROKE = 28;

export default function StatsScreen() {
  const { theme } = useTheme();
  const { history } = useCheckout();
  const [activeTab, setActiveTab] = useState<"payments" | "topups">("payments");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const donutAnim = useRef(new Animated.Value(0)).current;
  const donutScale = useRef(new Animated.Value(0.85)).current;
  const cardsAnim = useRef(new Animated.Value(0)).current;
  const cardsSlide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(donutAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(donutScale, { toValue: 1, friction: 6, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardsAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(cardsSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const s = styles(theme);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const monthName = now.toLocaleString("es-ES", { month: "long" });
  const prevMonthName = new Date(prevYear, prevMonth).toLocaleString("es-ES", { month: "long" });
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const payments = history.filter((t) => t.type === "payment");
  const topups = history.filter((t) => t.type === "topup");
  const isThisMonth = (iso: string) => {
    const d = new Date(iso);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  };
  const thisMonthPayments = payments.filter((t) => isThisMonth(t.date));
  const thisMonthTopups = topups.filter((t) => isThisMonth(t.date));
  const prevMonthPayments = payments.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
  });
  const totalThisMonth = thisMonthPayments.reduce((sum, t) => sum + t.amount, 0);
  const totalPrevMonth = prevMonthPayments.reduce((sum, t) => sum + t.amount, 0);
  const totalTopups = topups.reduce((sum, t) => sum + t.amount, 0);
  const totalPayments = payments.reduce((sum, t) => sum + t.amount, 0);
  const grandTotal = totalTopups + totalPayments;
  const paymentRatio = grandTotal > 0 ? totalPayments / grandTotal : 0;
  const topupRatio = grandTotal > 0 ? totalTopups / grandTotal : 1;
  const diff = totalThisMonth - totalPrevMonth;
  const diffPositive = diff >= 0;
  const activeList = activeTab === "payments" ? thisMonthPayments : thisMonthTopups;
  const activeColor = activeTab === "payments" ? "#EF4444" : "#22C55E";
  const activePrefix = activeTab === "payments" ? "-" : "+";
  const emptyMsg = activeTab === "payments" ? "Sin pagos este mes." : "Sin recargas este mes.";

  const DonutChart = () => (
    <Animated.View style={[
      { width: DONUT_SIZE, height: DONUT_SIZE, justifyContent: "center", alignItems: "center", position: "relative" },
      { opacity: donutAnim, transform: [{ scale: donutScale }] }
    ]}>
      <View style={[s.donutRing, { borderColor: theme.card }]} />
      <View style={[s.donutRing, {
        borderColor: "transparent",
        borderTopColor: "#22C55E",
        borderRightColor: topupRatio > 0.25 ? "#22C55E" : "transparent",
        borderBottomColor: topupRatio > 0.5 ? "#22C55E" : "transparent",
        borderLeftColor: topupRatio > 0.75 ? "#22C55E" : "transparent",
        transform: [{ rotate: "-90deg" }],
      }]} />
      <View style={[s.donutHole, { backgroundColor: theme.background }]} />
      <View style={{ alignItems: "center" }}>
        {grandTotal > 0 ? (
          <>
            <Text style={{ fontSize: 28, fontWeight: "800", color: theme.text }}>${totalPayments.toFixed(0)}</Text>
            <Text style={{ fontSize: 13, color: TEXT_SECONDARY }}>pagado</Text>
          </>
        ) : (
          <Text style={{ fontSize: 13, color: TEXT_SECONDARY }}>Sin datos</Text>
        )}
      </View>
    </Animated.View>
  );

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Animated.View style={[s.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.replace("/(tabs)/wallet")}>
          <ArrowLeft size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={s.title}>Estadísticas</Text>
      </Animated.View>

      <View style={s.donutSection}>
        <DonutChart />
        <Animated.View style={[s.legend, { opacity: donutAnim }]}>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: "#EF4444" }]} />
            <Text style={s.legendText}>Pagos ({(paymentRatio * 100).toFixed(0)}%)</Text>
          </View>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: "#22C55E" }]} />
            <Text style={s.legendText}>Recargas ({(topupRatio * 100).toFixed(0)}%)</Text>
          </View>
        </Animated.View>
      </View>

      <Animated.View style={{ opacity: cardsAnim, transform: [{ translateY: cardsSlide }] }}>
        <View style={s.cardsRow}>
          <TouchableOpacity
            style={[s.card, { flex: 1, borderWidth: 2, borderColor: activeTab === "payments" ? "#EF4444" : "transparent" }]}
            onPress={() => setActiveTab("payments")}
          >
            <Text style={s.cardLabel}>{cap(monthName)}</Text>
            <Text style={s.cardAmount}>${totalThisMonth.toFixed(2)}</Text>
            <Text style={[s.cardDiff, { color: diffPositive ? "#EF4444" : "#22C55E" }]}>
              {diffPositive ? "▲" : "▼"} ${Math.abs(diff).toFixed(2)} vs {prevMonthName}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.card, { flex: 1, borderWidth: 2, borderColor: activeTab === "topups" ? "#22C55E" : "transparent" }]}
            onPress={() => setActiveTab("topups")}
          >
            <Text style={s.cardLabel}>Total recargas</Text>
            <Text style={[s.cardAmount, { color: "#22C55E" }]}>${totalTopups.toFixed(2)}</Text>
            <Text style={s.cardSub}>{topups.length} recarga{topups.length !== 1 ? "s" : ""}</Text>
          </TouchableOpacity>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>
            {activeTab === "payments" ? "Pagos" : "Recargas"} de {cap(monthName)}
          </Text>
          {activeList.length === 0 ? (
            <Text style={s.empty}>{emptyMsg}</Text>
          ) : (
            activeList.map((t) => (
              <View key={t.id} style={s.txRow}>
                <Text style={s.txDate}>
                  {new Date(t.date).toLocaleDateString("es-ES", {
                    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                  })}
                </Text>
                <Text style={[s.txAmount, { color: activeColor }]}>
                  {activePrefix}${t.amount.toFixed(2)}
                </Text>
              </View>
            ))
          )}
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background, paddingHorizontal: 20, paddingTop: 60 },
    header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 28 },
    backBtn: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: theme.card, justifyContent: "center", alignItems: "center",
    },
    title: { fontSize: 22, fontWeight: "800", color: theme.text },
    donutSection: { alignItems: "center", marginBottom: 28, gap: 16 },
    donutRing: {
      position: "absolute", width: DONUT_SIZE, height: DONUT_SIZE,
      borderRadius: DONUT_SIZE / 2, borderWidth: STROKE,
    },
    donutHole: {
      position: "absolute",
      width: DONUT_SIZE - STROKE * 2, height: DONUT_SIZE - STROKE * 2,
      borderRadius: (DONUT_SIZE - STROKE * 2) / 2,
    },
    legend: { flexDirection: "row", gap: 20 },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 13, color: TEXT_SECONDARY },
    cardsRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
    card: { backgroundColor: theme.card, borderRadius: 18, padding: 16, gap: 4 },
    cardLabel: { fontSize: 12, color: TEXT_SECONDARY, fontWeight: "500" },
    cardAmount: { fontSize: 22, fontWeight: "800", color: theme.text },
    cardDiff: { fontSize: 12, fontWeight: "600" },
    cardSub: { fontSize: 12, color: TEXT_SECONDARY },
    section: { gap: 10 },
    sectionTitle: { fontSize: 16, fontWeight: "700", color: theme.text, marginBottom: 4 },
    empty: { fontSize: 14, color: TEXT_SECONDARY },
    txRow: {
      flexDirection: "row", justifyContent: "space-between",
      backgroundColor: theme.card, borderRadius: 12, padding: 14,
    },
    txDate: { fontSize: 13, color: TEXT_SECONDARY },
    txAmount: { fontSize: 14, fontWeight: "700" },
  });