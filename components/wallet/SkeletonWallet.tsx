import { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, Dimensions } from "react-native";
import { useTheme } from "@/context/ThemeContext";

const { width } = Dimensions.get("window");

function SkeletonBox({ width: w, height: h, borderRadius = 12, style }: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}) {
  const { theme } = useTheme();
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: w,
          height: h,
          borderRadius,
          backgroundColor: theme.card,
          opacity: anim,
        },
        style,
      ]}
    />
  );
}

export function WalletSkeleton() {
  const { theme } = useTheme();

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      {/* Card skeleton */}
      <View style={[s.card, { backgroundColor: theme.card }]}>
        <SkeletonBox width={120} height={14} borderRadius={8} />
        <SkeletonBox width={200} height={48} borderRadius={12} style={{ marginVertical: 8 }} />
        <SkeletonBox width={140} height={36} borderRadius={12} />
      </View>

      {/* Título historial */}
      <SkeletonBox width={100} height={18} borderRadius={8} style={{ marginBottom: 16 }} />

      {/* Filas de transacciones */}
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={[s.txRow, { backgroundColor: theme.card }]}>
          <SkeletonBox width={40} height={40} borderRadius={12} />
          <View style={s.txInfo}>
            <SkeletonBox width={120} height={14} borderRadius={6} />
            <SkeletonBox width={80} height={11} borderRadius={6} style={{ marginTop: 6 }} />
          </View>
          <SkeletonBox width={60} height={16} borderRadius={6} />
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 28,
    gap: 8,
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 14,
    gap: 12,
    marginBottom: 10,
  },
  txInfo: {
    flex: 1,
    gap: 4,
  },
});