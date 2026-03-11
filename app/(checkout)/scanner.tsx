import {View,TouchableOpacity,Text,StyleSheet,} from "react-native";
import { useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useState } from "react";

import { CameraScanner } from "../../components/scanner/CameraScanner";
import { useTheme } from "@/context/ThemeContext";

export default function PantallaDelScaner() {
  const [permiso, pedirPermiso] = useCameraPermissions();
  const { theme } = useTheme();
  const [processing, setProcessing] = useState(false);

  if (!permiso) return <View />;

  if (!permiso.granted) {
    pedirPermiso();
    return <View />;
  }

  const handleDataDetected = async (data: string) => {
    if (processing) return; // evita múltiples lecturas
    setProcessing(true);

    // Vibración
    await Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    );

    // 🔔 Notificación local
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "QR Detectado ✅",
        body: `Código: ${data}`,
      },
      trigger: null,
    });

    // Espera pequeña para que se vea efecto
    setTimeout(() => {
      router.push({
        pathname: "/(checkout)/payment",
        params: { code: data },
      });
    }, 800);
  };

  const handleGoMenu = () => {
    router.replace("/");
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <CameraScanner
        onDataDetected={handleDataDetected}
        disabled={processing}
      />

      {/* Botón volver */}
      <TouchableOpacity
        style={[
          styles.backButton,
          { backgroundColor: theme.card },
        ]}
        onPress={handleGoMenu}
      >
        <ArrowLeft size={20} color={theme.text} />
        <Text
          style={[
            styles.backText,
            { color: theme.text },
          ]}
        >
          Volver al menú
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: "absolute",
    top: 60,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    elevation: 5,
  },
  backText: {
    fontWeight: "600",
    fontSize: 14,
  },
});