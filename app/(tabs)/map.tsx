import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@/context/ThemeContext";
import { MapPin, RefreshCw, Search, Trash2, X } from "lucide-react-native";

const PRIMARY = "#6C63FF";
const TEXT_SECONDARY = "#64748b";
const STORAGE_KEY = "map_markers";

interface Marker {
  id: string;
  lat: number;
  lng: number;
  label: string;
}

type LocationState =
  | { status: "loading" }
  | { status: "denied" }
  | { status: "ready"; lat: number; lng: number; city: string };

export default function MapScreen() {
  const { theme } = useTheme();
  const webviewRef = useRef<WebView>(null);
  const [location, setLocation] = useState<LocationState>({ status: "loading" });
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const s = styles(theme);

  // Cargar marcadores persistidos
  useEffect(() => {
    const loadMarkers = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) setMarkers(JSON.parse(stored));
      } catch (e) {}
    };
    loadMarkers();
    fetchLocation();
  }, []);

  const saveMarkers = async (newMarkers: Marker[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newMarkers));
  };

  const fetchLocation = async () => {
    setLocation({ status: "loading" });
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setLocation({ status: "denied" });
      return;
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const { latitude, longitude } = loc.coords;
    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
    const city = place?.city ?? place?.region ?? "Tu ubicación";
    setLocation({ status: "ready", lat: latitude, lng: longitude, city });
  };

  // Añadir marcador desde el mapa (toque)
  const addMarkerFromMap = async (lat: number, lng: number) => {
    const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    const label =
      place?.street
        ? `${place.street}${place.streetNumber ? " " + place.streetNumber : ""}`
        : place?.city ?? place?.region ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    const newMarker: Marker = {
      id: Date.now().toString(),
      lat,
      lng,
      label,
    };
    const updated = [...markers, newMarker];
    setMarkers(updated);
    await saveMarkers(updated);
  };

  // Buscar por nombre (Nominatim - OpenStreetMap, gratis)
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5`,
        { headers: { "Accept-Language": "es" } }
      );
      const data = await res.json();
      setSearchResults(data);
    } catch (e) {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const selectSearchResult = async (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const label = result.display_name.split(",").slice(0, 2).join(", ");

    const newMarker: Marker = {
      id: Date.now().toString(),
      lat,
      lng,
      label,
    };
    const updated = [...markers, newMarker];
    setMarkers(updated);
    await saveMarkers(updated);

    // Mover el mapa al resultado
    webviewRef.current?.injectJavaScript(`
      map.setView([${lat}, ${lng}], 16);
      true;
    `);

    setSearchQuery("");
    setSearchResults([]);
    setShowSearch(false);
  };

  const deleteMarker = async (id: string) => {
    const updated = markers.filter((m) => m.id !== id);
    setMarkers(updated);
    await saveMarkers(updated);
    // Quitar del mapa
    webviewRef.current?.injectJavaScript(`
      if (markerMap["${id}"]) {
        map.removeLayer(markerMap["${id}"]);
        delete markerMap["${id}"];
      }
      true;
    `);
  };

  // Mensajes desde el WebView (toque en mapa)
  const onWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "tap") {
        addMarkerFromMap(data.lat, data.lng);
      }
    } catch (e) {}
  };

  // Sincronizar marcadores al WebView cuando cambian
  useEffect(() => {
    if (location.status !== "ready") return;
    const markersJS = markers
      .map(
        (m) => `
        (function() {
          if (!markerMap["${m.id}"]) {
            const mk = L.marker([${m.lat}, ${m.lng}], { icon: customIcon })
              .addTo(map)
              .bindPopup(\`<b>${m.label}</b>\`);
            markerMap["${m.id}"] = mk;
          }
        })();
      `
      )
      .join("\n");
    webviewRef.current?.injectJavaScript(`${markersJS} true;`);
  }, [markers, location.status]);

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
        .leaflet-popup-content-wrapper {
          border-radius: 10px;
          font-family: sans-serif;
          font-size: 13px;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const markerMap = {};

        const map = L.map('map', {
          zoomControl: true,
          attributionControl: false,
        }).setView([${lat}, ${lng}], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(map);

        // Icono para ubicación actual
        const selfIcon = L.divIcon({
          html: \`<div style="width:18px;height:18px;background:${PRIMARY};border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>\`,
          iconSize: [18, 18], iconAnchor: [9, 9], className: '',
        });

        // Icono para marcadores del usuario
        const customIcon = L.divIcon({
          html: \`<div style="width:18px;height:18px;background:#EF4444;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>\`,
          iconSize: [18, 18], iconAnchor: [9, 9], className: '',
        });

        L.marker([${lat}, ${lng}], { icon: selfIcon })
          .addTo(map)
          .bindPopup('<b>Tu ubicación</b>');

        // Enviar toque al RN
        map.on('click', function(e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'tap',
            lat: e.latlng.lat,
            lng: e.latlng.lng,
          }));
        });
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
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <MapPin size={18} color={PRIMARY} />
          <Text style={s.cityName}>{location.city}</Text>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity
            style={s.iconBtn}
            onPress={() => {
              setShowSearch(!showSearch);
              setSearchResults([]);
              setSearchQuery("");
            }}
          >
            <Search size={16} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={fetchLocation}>
            <RefreshCw size={16} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Buscador */}
      {showSearch && (
        <View style={s.searchContainer}>
          <View style={s.searchRow}>
            <TextInput
              style={s.searchInput}
              placeholder="Buscar lugar..."
              placeholderTextColor={TEXT_SECONDARY}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(""); setSearchResults([]); }}>
                <X size={18} color={TEXT_SECONDARY} />
              </TouchableOpacity>
            )}
          </View>
          {searching && (
            <ActivityIndicator size="small" color={PRIMARY} style={{ marginTop: 8 }} />
          )}
          {searchResults.length > 0 && (
            <FlatList
              data={searchResults}
              keyExtractor={(_, i) => i.toString()}
              style={s.resultsList}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={s.resultItem}
                  onPress={() => selectSearchResult(item)}
                >
                  <MapPin size={14} color={PRIMARY} />
                  <Text style={s.resultText} numberOfLines={2}>
                    {item.display_name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}

      {/* Mapa */}
      <WebView
        ref={webviewRef}
        style={s.map}
        source={{ html: getMapHTML(location.lat, location.lng) }}
        onMessage={onWebViewMessage}
        scrollEnabled={false}
        bounces={false}
      />

      {/* Lista de marcadores */}
      {markers.length > 0 && (
        <View style={s.markersList}>
          <FlatList
            data={markers}
            keyExtractor={(m) => m.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
            renderItem={({ item }) => (
              <View style={s.markerChip}>
                <MapPin size={12} color="#EF4444" />
                <Text style={s.markerChipText} numberOfLines={1}>
                  {item.label}
                </Text>
                <TouchableOpacity onPress={() => deleteMarker(item.id)}>
                  <Trash2 size={12} color={TEXT_SECONDARY} />
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    centered: { justifyContent: "center", alignItems: "center", gap: 12, padding: 32 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 14,
      backgroundColor: theme.background,
    },
    headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
    headerRight: { flexDirection: "row", gap: 8 },
    cityName: { fontSize: 20, fontWeight: "800", color: theme.text },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.card,
      justifyContent: "center",
      alignItems: "center",
    },
    // Search
    searchContainer: {
      paddingHorizontal: 16,
      paddingBottom: 8,
      backgroundColor: theme.background,
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.card,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: theme.text,
    },
    resultsList: {
      backgroundColor: theme.card,
      borderRadius: 12,
      marginTop: 6,
      maxHeight: 200,
    },
    resultItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.background,
    },
    resultText: {
      flex: 1,
      fontSize: 13,
      color: theme.text,
    },
    // Map
    map: { flex: 1 },
    // Markers list
    markersList: {
      paddingVertical: 12,
      backgroundColor: theme.background,
    },
    markerChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: theme.card,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      maxWidth: 180,
    },
    markerChipText: {
      flex: 1,
      fontSize: 12,
      color: theme.text,
      fontWeight: "500",
    },
    // States
    loadingText: { fontSize: 15, color: TEXT_SECONDARY, marginTop: 8 },
    deniedTitle: { fontSize: 18, fontWeight: "700", color: theme.text, marginTop: 8 },
    deniedText: { fontSize: 14, color: TEXT_SECONDARY, textAlign: "center" },
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
    retryText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  });