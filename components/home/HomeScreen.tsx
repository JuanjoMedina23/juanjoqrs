import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Settings, QrCode, Info } from "lucide-react-native";
import { createStyles } from "./home.styles";
import { useTheme } from "@/context/ThemeContext";

type Props = {
  onScanPress: () => void;
  onSettingsPress: () => void;
};

export const HomeView = ({
  onScanPress,
  onSettingsPress,
}: Props) => {
  const { theme, mode } = useTheme();
  const styles = createStyles(theme);

  const gradientColors =
  mode === "dark"
    ? ["#0f172a", "#1e293b"] as const
    : ["#f8fafc", "#f1f5f9"] as const;

  return (
    <LinearGradient
      colors={gradientColors}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={onSettingsPress}
        >
          <Settings size={22} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.main}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>JuanjoQr’s</Text>
          <Text style={styles.subtitle}>
            Scanner Profesional
          </Text>
        </View>

        <TouchableOpacity
          style={styles.scanButton}
          onPress={onScanPress}
          activeOpacity={0.9}
        >
          <QrCode size={24} color="#0f172a" />
          <Text style={styles.scanText}>
            Escanear QR
          </Text>
        </TouchableOpacity>

        <View style={styles.infoRow}>
          <Info size={16} color={theme.text} />
          <Text style={styles.infoText}>
            Apunta y escanea al instante
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.homeIndicator} />
      </View>
    </LinearGradient>
  );
};