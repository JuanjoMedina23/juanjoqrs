import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ScanLine, QrCode, Loader2 } from "lucide-react-native";

export default function PaymentScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        
        {/* Icono superior */}
        <View style={styles.iconContainer}>
          <ScanLine size={40} color="#2563eb" />
        </View>

        <Text style={styles.title}>Analizando QR</Text>

        <View style={styles.loadingRow}>
          <Loader2 size={16} color="#666" />
          <Text style={styles.subtitle}>
            JuanjoQr's está procesando el código...
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.codeHeader}>
          <QrCode size={18} color="#2563eb" />
          <Text style={styles.label}>Código escaneado</Text>
        </View>

        <Text style={styles.code}>{code || "Sin código"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 28,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  iconContainer: {
    alignSelf: "center",
    marginBottom: 16,
    backgroundColor: "#e0edff",
    padding: 16,
    borderRadius: 50,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
    color: "#0f172a",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 22,
  },
  codeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    color: "#64748b",
  },
  code: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2563eb",
  },
});