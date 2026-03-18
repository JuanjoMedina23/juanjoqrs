import { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { ScanLine, Wallet, MapPin } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";

const PRIMARY = "#6C63FF";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const FEATURES = [
  {
    icon: ScanLine,
    color: "#6C63FF",
    bg: "#EEF2FF",
    title: "Escanea y paga",
    desc: "Apunta la cámara a cualquier QR para realizar pagos al instante.",
  },
  {
    icon: Wallet,
    color: "#22C55E",
    bg: "#DCFCE7",
    title: "Controla tu saldo",
    desc: "Recarga tu wallet y consulta tu historial de pagos en cualquier momento.",
  },
  {
    icon: MapPin,
    color: "#F59E0B",
    bg: "#FEF3C7",
    title: "Explora el mapa",
    desc: "Marca tus lugares favoritos y búscalos directamente desde la app.",
  },
];

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const s = styles(theme);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const featureAnims = useRef(FEATURES.map(() => ({
    opacity: new Animated.Value(0),
    translateY: new Animated.Value(20),
  }))).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    featureAnims.forEach((anim, i) => {
      Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 500,
          delay: 400 + i * 150,
          useNativeDriver: true,
        }),
        Animated.timing(anim.translateY, {
          toValue: 0,
          duration: 500,
          delay: 400 + i * 150,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, []);

  const handleStart = () => {
    router.replace("/(auth)/login");
  };

  return (
    <View style={s.container}>
      <Animated.View
        style={[s.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        <View style={s.logoWrapper}>
          <ScanLine size={36} color="#fff" />
        </View>
        <Text style={s.title}>Bienvenido a JuanjoQRs</Text>
        <Text style={s.subtitle}>
          Tu app de pagos con QR. Rápido, seguro y sencillo.
        </Text>
      </Animated.View>

      <View style={s.features}>
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          return (
            <Animated.View
              key={i}
              style={[
                s.featureRow,
                { backgroundColor: theme.card },
                {
                  opacity: featureAnims[i].opacity,
                  transform: [{ translateY: featureAnims[i].translateY }],
                },
              ]}
            >
              <View style={[s.featureIcon, { backgroundColor: f.bg }]}>
                <Icon size={22} color={f.color} />
              </View>
              <View style={s.featureText}>
                <Text style={[s.featureTitle, { color: theme.text }]}>{f.title}</Text>
                <Text style={s.featureDesc}>{f.desc}</Text>
              </View>
            </Animated.View>
          );
        })}
      </View>

      <Animated.View style={{ opacity: fadeAnim, width: "100%" }}>
        <TouchableOpacity style={s.btn} onPress={handleStart}>
          <Text style={s.btnText}>Ir al inicio de sesión</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingHorizontal: 24,
      paddingTop: 80,
      paddingBottom: 40,
      alignItems: "center",
      justifyContent: "space-between",
    },
    header: {
      alignItems: "center",
      gap: 12,
      marginBottom: 8,
    },
    logoWrapper: {
      width: 80,
      height: 80,
      borderRadius: 24,
      backgroundColor: PRIMARY,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
      elevation: 8,
      shadowColor: PRIMARY,
      shadowOpacity: 0.4,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
    },
    title: {
      fontSize: 26,
      fontWeight: "800",
      color: theme.text,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 15,
      color: "#64748b",
      textAlign: "center",
      lineHeight: 22,
    },
    features: {
      width: "100%",
      gap: 12,
    },
    featureRow: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 18,
      padding: 16,
      gap: 14,
    },
    featureIcon: {
      width: 48,
      height: 48,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
    },
    featureText: { flex: 1 },
    featureTitle: {
      fontSize: 15,
      fontWeight: "700",
      marginBottom: 3,
    },
    featureDesc: {
      fontSize: 13,
      color: "#64748b",
      lineHeight: 18,
    },
    btn: {
      backgroundColor: PRIMARY,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: "center",
      width: "100%",
      elevation: 4,
      shadowColor: PRIMARY,
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
    },
    btnText: {
      color: "#fff",
      fontSize: 17,
      fontWeight: "700",
    },
  });