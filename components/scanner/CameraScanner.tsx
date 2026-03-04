import { useState, useCallback } from "react";
import { View, StyleSheet, LayoutRectangle } from "react-native";
import { CameraView, BarcodeScanningResult } from "expo-camera";
import { useFocusEffect } from "expo-router";

type Props = {
  onDataDetected: (data: string) => void;
  disabled?: boolean;
};

export const CameraScanner = ({ onDataDetected, disabled=false }: Props) => {
  const [detectado, setDetectado] = useState(false);
  const [frameLayout, setFrameLayout] =
    useState<LayoutRectangle | null>(null);

  useFocusEffect(
    useCallback(() => {
      // Reset cuando la pantalla vuelve a foco
      setDetectado(false);
    }, [])
  );

  const handlerBarcodeScanner = (
    result: BarcodeScanningResult
  ) => {
    if (detectado || !frameLayout) return;

    const { data, bounds } = result;

   
    if (!bounds?.origin || !bounds?.size) return;

    const { origin, size } = bounds;

    // Centro del QR detectado
    const qrCenterX = origin.x + size.width / 2;
    const qrCenterY = origin.y + size.height / 2;

    const insideFrame =
      qrCenterX >= frameLayout.x &&
      qrCenterX <= frameLayout.x + frameLayout.width &&
      qrCenterY >= frameLayout.y &&
      qrCenterY <= frameLayout.y + frameLayout.height;

    if (!insideFrame) return;

    setDetectado(true);

    onDataDetected(data);

    // Permitir volver a escanear después de 1 segundo
    setTimeout(() => {
      setDetectado(false);
    }, 1000);
  };

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={disabled ? undefined : handlerBarcodeScanner}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "ean13"],
        }}
      />

      <View style={styles.overlay}>
        <View
          onLayout={(e) =>
            setFrameLayout(e.nativeEvent.layout)
          }
          style={[
            styles.frame,
            {
              borderColor: detectado
                ? "#2196F3"
                : "#888888",
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  frame: {
    width: 250,
    height: 250,
    borderWidth: 4,
    borderRadius: 16,
  },
});