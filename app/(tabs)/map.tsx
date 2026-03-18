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
  Modal,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@/context/ThemeContext";
import { useAuthContext } from "@/context/AuthContext";
import { MapPin, RefreshCw, Search, Trash2, X, Star, Eye, Tag } from "lucide-react-native";

const PRIMARY = "#6C63FF";
const TEXT_SECONDARY = "#64748b";

type Category = "favorito" | "visitado" | "otro";

const CATEGORIES: { key: Category; label: string; color: string; icon: any }[] = [
  { key: "favorito", label: "Favorito", color: "#F59E0B", icon: Star },
  { key: "visitado", label: "Visitado", color: "#22C55E", icon: Eye },
  { key: "otro",     label: "Otro",     color: "#EF4444", icon: Tag },
];

const getCategoryColor = (cat: Category) =>
  CATEGORIES.find((c) => c.key === cat)?.color ?? "#EF4444";

interface MarkerData {
  id: string;
  lat: number;
  lng: number;
  label: string;
  category: Category;
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
  const { user } = useAuthContext();
  const mapRef = useRef<MapView>(null);

  const userId = user?.id ?? "guest";
  const STORAGE_KEY = `map_markers_${userId}`;

  const [location, setLocation] = useState<LocationState>({ status: "loading" });
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [filterCategory, setFilterCategory] = useState<Category | null>(null);

  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number; defaultLabel: string } | null>(null);
  const [modalName, setModalName] = useState("");
  const [modalCategory, setModalCategory] = useState<Category>("otro");

  const s = styles(theme);

  const isDark =
    mode === "dark" ||
    (mode === "normal" && theme.background === "#0f172a");

  // Recargar marcadores cuando cambia el usuario
  useEffect(() => {
    setMarkers([]);
    const loadMarkers = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) setMarkers(JSON.parse(stored));
      } catch (e) {}
    };
    loadMarkers();
    fetchLocation();
  }, [userId]);

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

  const handleLongPress = async (lat: number, lng: number) => {
    const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    const defaultLabel =
      place?.street
        ? `${place.street}${place.streetNumber ? " " + place.streetNumber : ""}`
        : place?.city ?? place?.region ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    setModalName(defaultLabel);
    setModalCategory("otro");
    setPendingCoords({ lat, lng, defaultLabel });
  };

  const confirmAddMarker = async () => {
    if (!pendingCoords) return;
    const newMarker: MarkerData = {
      id: Date.now().toString(),
      lat: pendingCoords.lat,
      lng: pendingCoords.lng,
      label: modalName.trim() || pendingCoords.defaultLabel,
      category: modalCategory,
    };
    const updated = [...markers, newMarker];
    setMarkers(updated);
    await saveMarkers(updated);
    setPendingCoords(null);
    setModalName("");
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
    const defaultLabel = result.display_name.split(",").slice(0, 2).join(", ");

    setModalName(defaultLabel);
    setModalCategory("otro");
    setPendingCoords({ lat, lng, defaultLabel });

    mapRef.current?.animateToRegion({
      latitude: lat, longitude: lng,
      latitudeDelta: 0.01, longitudeDelta: 0.01,
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

  const filteredMarkers = filterCategory
    ? markers.filter((m) => m.category === filterCategory)
    : markers;

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
        <Text style={s.deniedText}>Necesitamos acceso a tu ubicación para mostrar el mapa.</Text>
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
      <View style={s.header}>
        <View style={s.headerLeft}>
          <MapPin size={18} color={PRIMARY} />
          <Text style={s.cityName}>{location.city}</Text>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity
            style={s.iconBtn}
            onPress={() => { setShowSearch(!showSearch); setSearchResults([]); setSearchQuery(""); }}
          >
            <Search size={16} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={fetchLocation}>
            <RefreshCw size={16} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.filterRow}>
        <TouchableOpacity
          style={[s.filterChip, filterCategory === null && { backgroundColor: PRIMARY }]}
          onPress={() => setFilterCategory(null)}
        >
          <Text style={[s.filterChipText, filterCategory === null && { color: "#fff" }]}>
            Todos
          </Text>
        </TouchableOpacity>
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const active = filterCategory === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[s.filterChip, active && { backgroundColor: cat.color }]}
              onPress={() => setFilterCategory(active ? null : cat.key)}
            >
              <Icon size={12} color={active ? "#fff" : TEXT_SECONDARY} />
              <Text style={[s.filterChipText, active && { color: "#fff" }]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

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
          {searching && <ActivityIndicator size="small" color={PRIMARY} style={{ marginTop: 8 }} />}
          {searchResults.length > 0 && (
            <FlatList
              data={searchResults}
              keyExtractor={(_, i) => i.toString()}
              style={s.resultsList}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity style={s.resultItem} onPress={() => selectSearchResult(item)}>
                  <MapPin size={14} color={PRIMARY} />
                  <Text style={s.resultText} numberOfLines={2}>{item.display_name}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}

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
          handleLongPress(latitude, longitude);
        }}
      >
        {filteredMarkers.map((m) => (
          <Marker
            key={m.id}
            coordinate={{ latitude: m.lat, longitude: m.lng }}
            title={m.label}
            pinColor={getCategoryColor(m.category)}
          />
        ))}
      </MapView>

      {filteredMarkers.length > 0 && (
        <View style={s.markersList}>
          <FlatList
            data={filteredMarkers}
            keyExtractor={(m) => m.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
            renderItem={({ item }) => (
              <View style={[s.markerChip, { borderLeftColor: getCategoryColor(item.category), borderLeftWidth: 3 }]}>
                <MapPin size={12} color={getCategoryColor(item.category)} />
                <Text style={s.markerChipText} numberOfLines={1}>{item.label}</Text>
                <TouchableOpacity onPress={() => deleteMarker(item.id)}>
                  <Trash2 size={12} color={TEXT_SECONDARY} />
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      )}

      <Modal
        visible={pendingCoords !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setPendingCoords(null)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={s.modalOverlay}>
            <View style={[s.modalCard, { backgroundColor: theme.card }]}>
              <Text style={[s.modalTitle, { color: theme.text }]}>Nuevo marcador</Text>

              <TextInput
                style={[s.modalInput, { backgroundColor: theme.background, color: theme.text }]}
                placeholder="Nombre del lugar"
                placeholderTextColor={TEXT_SECONDARY}
                value={modalName}
                onChangeText={setModalName}
                autoFocus
              />

              <Text style={[s.modalLabel, { color: TEXT_SECONDARY }]}>Categoría</Text>
              <View style={s.categoryRow}>
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const active = modalCategory === cat.key;
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      style={[s.categoryBtn, active && { backgroundColor: cat.color }]}
                      onPress={() => setModalCategory(cat.key)}
                    >
                      <Icon size={16} color={active ? "#fff" : TEXT_SECONDARY} />
                      <Text style={[s.categoryBtnText, active && { color: "#fff" }]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={s.modalActions}>
                <TouchableOpacity
                  style={[s.modalBtn, { backgroundColor: theme.background }]}
                  onPress={() => setPendingCoords(null)}
                >
                  <Text style={[s.modalBtnText, { color: theme.text }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.modalBtn, { backgroundColor: PRIMARY }]}
                  onPress={confirmAddMarker}
                >
                  <Text style={[s.modalBtnText, { color: "#fff" }]}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    centered: { justifyContent: "center", alignItems: "center", gap: 12, padding: 32 },
    header: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: 20, paddingTop: 60, paddingBottom: 14,
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
    filterRow: {
      flexDirection: "row", gap: 8,
      paddingHorizontal: 16, paddingBottom: 10,
      backgroundColor: theme.background,
    },
    filterChip: {
      flexDirection: "row", alignItems: "center", gap: 4,
      paddingHorizontal: 12, paddingVertical: 6,
      borderRadius: 20, backgroundColor: theme.card,
    },
    filterChipText: { fontSize: 12, fontWeight: "600", color: TEXT_SECONDARY },
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
    resultsList: { backgroundColor: theme.card, borderRadius: 12, marginTop: 6, maxHeight: 200 },
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
    modalOverlay: { flex: 1, justifyContent: "flex-end" },
    modalCard: {
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 24, gap: 14,
    },
    modalTitle: { fontSize: 18, fontWeight: "800" },
    modalLabel: { fontSize: 12, fontWeight: "600", letterSpacing: 0.5 },
    modalInput: {
      borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    },
    categoryRow: { flexDirection: "row", gap: 10 },
    categoryBtn: {
      flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
      gap: 6, paddingVertical: 10, borderRadius: 12,
      backgroundColor: theme.background,
    },
    categoryBtnText: { fontSize: 13, fontWeight: "600", color: TEXT_SECONDARY },
    modalActions: { flexDirection: "row", gap: 10, marginTop: 4 },
    modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center" },
    modalBtnText: { fontWeight: "700", fontSize: 15 },
  });