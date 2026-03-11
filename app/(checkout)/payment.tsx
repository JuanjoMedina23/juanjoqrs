import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { CheckCircle, XCircle, ArrowLeft, Wallet } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { useCheckout } from "@/context/CheckoutContext";

const PRIMARY = "#6C63FF";
const TEXT_SECONDARY = "#64748b";
const BORDER = "#e2e8f0";

type Status = "confirming" | "loading" | "success" | "error";

export default function PaymentScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { theme } = useTheme();
  const { balance, pay } = useCheckout();

  const [status, setStatus] = useState<Status>("confirming");
  const [errorMsg, setErrorMsg] = useState("");
  const [newBalance, setNewBalance] = useState(0);

  const amount = parseFloat(code ?? "");
  const isValidAmount = !isNaN(amount) && amount > 0;

  const handlePay = async () => {
    setStatus("loading");
    const result = await pay(code ?? "");
    if (result.success) {
      setNewBalance(balance - amount);
      setStatus("success");
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
          <Text style={s.amount}>
            {isValidAmount ? `$${amount.toFixed(2)}` : "QR inválido"}
          </Text>
          <View style={s.balanceRow}>
            <Wallet size={16} color={TEXT_SECONDARY} />
            <Text style={s.balanceText}>Saldo disponible: ${balance.toFixed(2)}</Text>
          </View>

          {!isValidAmount && (
            <Text style={s.errorText}>Este QR no contiene un monto válido.</Text>
          )}

          <TouchableOpacity
            style={[s.btn, s.btnPrimary, !isValidAmount && s.btnDisabled]}
            onPress={handlePay}
            disabled={!isValidAmount}
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
        <View style={s.card}>
          <CheckCircle size={64} color="#22C55E" />
          <Text style={s.successTitle}>¡Pago exitoso!</Text>
          <Text style={s.amount}>${amount.toFixed(2)}</Text>
          <Text style={s.balanceText}>Nuevo saldo: ${newBalance.toFixed(2)}</Text>

          <TouchableOpacity
            style={[s.btn, s.btnPrimary, { marginTop: 24 }]}
            onPress={handleGoWallet}
          >
            <Wallet size={16} color="#fff" />
            <Text style={s.btnPrimaryText}>Ver wallet</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[s.btn, s.btnSecondary]} onPress={handleBack}>
            <Text style={[s.btnSecondaryText, { color: theme.text }]}>
              Volver al inicio
            </Text>
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

        <TouchableOpacity
          style={[s.btn, s.btnPrimary, { marginTop: 24 }]}
          onPress={() => setStatus("confirming")}
        >
          <Text style={s.btnPrimaryText}>Reintentar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[s.btn, s.btnSecondary]} onPress={handleBack}>
          <Text style={[s.btnSecondaryText, { color: theme.text }]}>
            Volver al inicio
          </Text>
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
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    card: {
      width: "100%",
      backgroundColor: theme.card,
      borderRadius: 24,
      padding: 28,
      alignItems: "center",
      gap: 12,
      elevation: 6,
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    },
    label: {
      fontSize: 14,
      color: TEXT_SECONDARY,
      fontWeight: "500",
    },
    amount: {
      fontSize: 48,
      fontWeight: "800",
      color: theme.text,
      letterSpacing: -1,
    },
    balanceRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    balanceText: {
      fontSize: 14,
      color: TEXT_SECONDARY,
    },
    successTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: "#22C55E",
    },
    errorTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: "#EF4444",
    },
    errorText: {
      fontSize: 14,
      color: "#EF4444",
      textAlign: "center",
    },
    btn: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: 14,
    },
    btnPrimary: {
      backgroundColor: PRIMARY,
    },
    btnPrimaryText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 16,
    },
    btnSecondary: {
      borderWidth: 1,
      borderColor: BORDER,
    },
    btnSecondaryText: {
      fontWeight: "600",
      fontSize: 15,
    },
    btnDisabled: {
      opacity: 0.4,
    },
  });
