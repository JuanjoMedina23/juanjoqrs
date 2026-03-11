import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import { useTheme } from "@/context/ThemeContext";
import { MapPin, RefreshCw } from "lucide-react-native";

const PRIMARY = "#6C63FF";
const TEXT_SECONDARY = "#64748b";

type LocationState =
  | { status: "loading" }
  | { status: "denied" }
  | { status: "ready"; lat: number; lng: number; city: string };

export default function MapScreen() {
  const { theme } = useTheme();
  const [location, setLocation] = useState<LocationState>({ status: "loading" });
  const s = styles(theme);

  const fetchLocation = async () => {
    setLocation({ status: "loading" });
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setLocation({ status: "denied" });
      return;
    }

    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const { latitude, longitude } = loc.coords;

    // Reverse geocoding para obtener el nombre de la ciudad
    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
    const city = place?.city ?? place?.region ?? "Tu ubicación";

    setLocation({ status: "ready", lat: latitude, lng: longitude, city });
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  const getMapHTML = (lat: number, lng: number) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #map { width: 100%; height: 100%; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map', {
          zoomControl: true,
          attributionControl: false,
        }).setView([${lat}, ${lng}], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(map);

        const icon = L.divIcon({
          html: \`<div style="
            width: 20px;
            height: 20px;
            background: ${PRIMARY};
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          "></div>\`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
          className: '',
        });

        L.marker([${lat}, ${lng}], { icon }).addTo(map);
      </script>
    </body>
    </html>
  `;

  if (location.status === "loading") {
    return (
      <View style={[s.container, s.centered]}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={s.loadingText}>Obteniendo ubicación...</Text>
      </View>
    );
  }

  if (location.status === "denied") {
    return (
      <View style={[s.container, s.centered]}>
        <MapPin size={48} color={TEXT_SECONDARY} />
        <Text style={s.deniedTitle}>Permiso denegado</Text>
        <Text style={s.deniedText}>
          Necesitamos acceso a tu ubicación para mostrar el mapa.
        </Text>
        <TouchableOpacity style={s.retryBtn} onPress={fetchLocation}>
          <RefreshCw size={16} color="#fff" />
          <Text style={s.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <MapPin size={20} color={PRIMARY} />
          <Text style={s.cityName}>{location.city}</Text>
        </View>
        <TouchableOpacity style={s.refreshBtn} onPress={fetchLocation}>
          <RefreshCw size={16} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Mapa */}
      <WebView
        style={s.map}
        source={{ html: getMapHTML(location.lat, location.lng) }}
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    centered: {
      justifyContent: "center",
      alignItems: "center",
      gap: 12,
      padding: 32,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 16,
      backgroundColor: theme.background,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    cityName: {
      fontSize: 20,
      fontWeight: "800",
      color: theme.text,
    },
    refreshBtn: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: theme.card,
      justifyContent: "center",
      alignItems: "center",
    },
    map: {
      flex: 1,
    },
    loadingText: {
      fontSize: 15,
      color: TEXT_SECONDARY,
      marginTop: 8,
    },
    deniedTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.text,
      marginTop: 8,
    },
    deniedText: {
      fontSize: 14,
      color: TEXT_SECONDARY,
      textAlign: "center",
    },
    retryBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: PRIMARY,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 14,
      marginTop: 8,
    },
    retryText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 15,
    },
  });