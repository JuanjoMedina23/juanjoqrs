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
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@/context/ThemeContext";
import { MapPin, RefreshCw, Search, Trash2, X } from "lucide-react-native";

const PRIMARY = "#6C63FF";
const TEXT_SECONDARY = "#64748b";
const STORAGE_KEY = "map_markers";

interface MarkerData {
  id: string;
  lat: number;
  lng: number;
  label: string;
}

type LocationState =
  | { status: "loading" }
  | { status: "denied" }
  | { status: "ready"; lat: number; lng: number; city: string };

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#0f172a" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#334155" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0c1a2e" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#172032" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
];

export default function MapScreen() {
  const { theme, mode } = useTheme();
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<LocationState>({ status: "loading" });
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const s = styles(theme);

  const isDark =
    mode === "dark" ||
    (mode === "normal" && theme.background === "#0f172a");

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

  const saveMarkers = async (newMarkers: MarkerData[]) => {
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

  const addMarkerFromMap = async (lat: number, lng: number) => {
    const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    const label =
      place?.street
        ? `${place.street}${place.streetNumber ? " " + place.streetNumber : ""}`
        : place?.city ?? place?.region ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    const newMarker: MarkerData = { id: Date.now().toString(), lat, lng, label };
    const updated = [...markers, newMarker];
    setMarkers(updated);
    await saveMarkers(updated);
  };

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

    const newMarker: MarkerData = { id: Date.now().toString(), lat, lng, label };
    const updated = [...markers, newMarker];
    setMarkers(updated);
    await saveMarkers(updated);

    mapRef.current?.animateToRegion({
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 600);

    setSearchQuery("");
    setSearchResults([]);
    setShowSearch(false);
  };

  const deleteMarker = async (id: string) => {
    const updated = markers.filter((m) => m.id !== id);
    setMarkers(updated);
    await saveMarkers(updated);
  };

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
      <MapView
        ref={mapRef}
        style={s.map}
        provider={PROVIDER_GOOGLE}
        customMapStyle={isDark ? DARK_MAP_STYLE : []}
        initialRegion={{
          latitude: location.lat,
          longitude: location.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        onLongPress={(e) => {
          const { latitude, longitude } = e.nativeEvent.coordinate;
          addMarkerFromMap(latitude, longitude);
        }}
      >
        {markers.map((m) => (
          <Marker
            key={m.id}
            coordinate={{ latitude: m.lat, longitude: m.lng }}
            title={m.label}
            pinColor="#EF4444"
          />
        ))}
      </MapView>

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
                <Text style={s.markerChipText} numberOfLines={1}>{item.label}</Text>
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
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: theme.card,
      justifyContent: "center", alignItems: "center",
    },
    searchContainer: {
      paddingHorizontal: 16, paddingBottom: 8,
      backgroundColor: theme.background,
    },
    searchRow: {
      flexDirection: "row", alignItems: "center",
      backgroundColor: theme.card,
      borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, gap: 8,
    },
    searchInput: { flex: 1, fontSize: 15, color: theme.text },
    resultsList: {
      backgroundColor: theme.card, borderRadius: 12, marginTop: 6, maxHeight: 200,
    },
    resultItem: {
      flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12,
      borderBottomWidth: 1, borderBottomColor: theme.background,
    },
    resultText: { flex: 1, fontSize: 13, color: theme.text },
    map: { flex: 1 },
    markersList: { paddingVertical: 12, backgroundColor: theme.background },
    markerChip: {
      flexDirection: "row", alignItems: "center", gap: 6,
      backgroundColor: theme.card,
      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, maxWidth: 180,
    },
    markerChipText: { flex: 1, fontSize: 12, color: theme.text, fontWeight: "500" },
    loadingText: { fontSize: 15, color: TEXT_SECONDARY, marginTop: 8 },
    deniedTitle: { fontSize: 18, fontWeight: "700", color: theme.text, marginTop: 8 },
    deniedText: { fontSize: 14, color: TEXT_SECONDARY, textAlign: "center" },
    retryBtn: {
      flexDirection: "row", alignItems: "center", gap: 8,
      backgroundColor: PRIMARY, paddingHorizontal: 20, paddingVertical: 12,
      borderRadius: 14, marginTop: 8,
    },
    retryText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  });