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
import LottieView from "lottie-react-native";
import { ScanLine, Wallet, MapPin } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";

const PRIMARY = "#6C63FF";
const TEXT_SECONDARY = "#64748b";
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

  const lottieAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(20)).current;
  const featureAnims = useRef(FEATURES.map(() => ({
    opacity: new Animated.Value(0),
    translateY: new Animated.Value(20),
  }))).current;
  const btnAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(lottieAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(titleAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(titleSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.stagger(
        120,
        featureAnims.map((anim) =>
          Animated.parallel([
            Animated.timing(anim.opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(anim.translateY, { toValue: 0, duration: 400, useNativeDriver: true }),
          ])
        )
      ),
      Animated.timing(btnAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={s.container}>
      {/* Lottie animación */}
      <Animated.View style={[s.lottieWrapper, { opacity: lottieAnim }]}>
        <LottieView
          source={require("../../assets/animations/onboarding.json")}
          autoPlay
          loop
          style={{ width: SCREEN_WIDTH * 0.65, height: SCREEN_WIDTH * 0.65 }}
        />
      </Animated.View>

      {/* Título */}
      <Animated.View
        style={[
          s.titleWrapper,
          { opacity: titleAnim, transform: [{ translateY: titleSlide }] },
        ]}
      >
        <Text style={s.title}>Bienvenido a JuanjoQRs</Text>
        <Text style={s.subtitle}>
          Tu app de pagos con QR. Rápido, seguro y sencillo.
        </Text>
      </Animated.View>

      {/* Features */}
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

      {/* Botón */}
      <Animated.View style={[s.btnWrapper, { opacity: btnAnim }]}>
        <TouchableOpacity
          style={s.btn}
          onPress={() => router.replace("/(auth)/login")}
        >
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
      paddingTop: 60,
      paddingBottom: 40,
      alignItems: "center",
    },
    lottieWrapper: {
      alignItems: "center",
      marginBottom: 8,
    },
    titleWrapper: {
      alignItems: "center",
      marginBottom: 24,
      gap: 6,
    },
    title: {
      fontSize: 26,
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
    features: {
      width: "100%",
      gap: 10,
      flex: 1,
    },
    featureRow: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 18,
      padding: 14,
      gap: 14,
    },
    featureIcon: {
      width: 46,
      height: 46,
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
      color: TEXT_SECONDARY,
      lineHeight: 18,
    },
    btnWrapper: {
      width: "100%",
      marginTop: 24,
    },
    btn: {
      backgroundColor: PRIMARY,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: "center",
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