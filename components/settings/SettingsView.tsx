import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Animated,
} from "react-native";
import {
  Sun, Moon, ArrowLeft, LogOut, Lock, User, Info, ChevronRight, Pencil, Camera,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "@/context/ThemeContext";
import { useAuthContext } from "@/context/AuthContext";
import { supabase } from "@/lib/core/auth/supabaseClient";
import { createStyles } from "./settings.styles";

type Mode = "normal" | "light" | "dark";
type Props = {
  currentMode: Mode;
  onChangeMode: (mode: Mode) => void;
  onBackPress: () => void;
};

const PRIMARY = "#6C63FF";
const TEXT_SECONDARY = "#64748b";
const APP_VERSION = "1.0.0";

export const SettingsView = ({ currentMode, onChangeMode, onBackPress }: Props) => {
  const { theme } = useTheme();
  const { user, signOut } = useAuthContext();
  const styles = createStyles(theme);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Animaciones
  const headerAnim = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;
  const userCardAnim = useRef(new Animated.Value(0)).current;
  const userCardSlide = useRef(new Animated.Value(20)).current;
  const sectionsAnim = useRef(new Animated.Value(0)).current;
  const sectionsSlide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(headerSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(userCardAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(userCardSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(sectionsAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(sectionsSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      const { data } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).single();
      if (data) {
        setFullName(data.full_name ?? "");
        setAvatarUrl(data.avatar_url ?? null);
      } else {
        setFullName(user.user_metadata?.full_name ?? "");
        setAvatarUrl(user.user_metadata?.avatar_url ?? null);
      }
    };
    loadProfile();
  }, [user]);

  const displayName = fullName || (user?.email?.split("@")[0] ?? "Usuario");

  const handleSignOut = () => {
    Alert.alert("Cerrar sesión", "¿Estás seguro que quieres cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Cerrar sesión", style: "destructive", onPress: signOut },
    ]);
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) { Alert.alert("Error", "Por favor completa ambos campos."); return; }
    if (newPassword !== confirmPassword) { Alert.alert("Error", "Las contraseñas no coinciden."); return; }
    if (newPassword.length < 6) { Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres."); return; }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) { Alert.alert("Error", error.message); }
    else { Alert.alert("Éxito", "Contraseña actualizada correctamente."); setShowChangePassword(false); setNewPassword(""); setConfirmPassword(""); }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permiso denegado", "Necesitamos acceso a tu galería."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploadingAvatar(true);
    try {
      const ext = asset.uri.split(".").pop() ?? "jpg";
      const fileName = `${user!.id}/avatar.${ext}`;
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();
      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, arrayBuffer, { contentType: `image/${ext}`, upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
      setAvatarUrl(urlData.publicUrl + "?t=" + Date.now());
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "No se pudo subir la imagen.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").upsert({ id: user.id, full_name: fullName.trim(), avatar_url: avatarUrl, updated_at: new Date().toISOString() });
    setSavingProfile(false);
    if (error) { Alert.alert("Error", error.message); }
    else { Alert.alert("Éxito", "Perfil actualizado correctamente."); setShowEditProfile(false); }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

      {/* Header animado */}
      <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerSlide }] }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración</Text>
      </Animated.View>

      {/* User card animada */}
      <Animated.View style={{ opacity: userCardAnim, transform: [{ translateY: userCardSlide }] }}>
        <View style={[s.userCard, { backgroundColor: theme.card }]}>
          <TouchableOpacity style={s.avatarWrapper} onPress={handlePickImage} disabled={uploadingAvatar}>
            {uploadingAvatar ? (
              <View style={[s.avatarFallback, { backgroundColor: PRIMARY }]}><ActivityIndicator color="#fff" /></View>
            ) : avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={s.avatar} />
            ) : (
              <View style={[s.avatarFallback, { backgroundColor: PRIMARY }]}>
                <Text style={s.avatarLetter}>{displayName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={s.cameraBtn}><Camera size={12} color="#fff" /></View>
          </TouchableOpacity>
          <View style={s.userInfo}>
            <Text style={[s.userName, { color: theme.text }]}>{displayName}</Text>
            <Text style={[s.userEmail, { color: TEXT_SECONDARY }]}>{user?.email}</Text>
          </View>
          <TouchableOpacity onPress={() => setShowEditProfile(!showEditProfile)}>
            <Pencil size={18} color={PRIMARY} />
          </TouchableOpacity>
        </View>

        {showEditProfile && (
          <View style={[s.editCard, { backgroundColor: theme.card }]}>
            <Text style={[s.editLabel, { color: TEXT_SECONDARY }]}>Nombre</Text>
            <TextInput style={[s.input, { backgroundColor: theme.background, color: theme.text }]} placeholder="Tu nombre" placeholderTextColor={TEXT_SECONDARY} value={fullName} onChangeText={setFullName} />
            <TouchableOpacity style={[s.saveBtn, { backgroundColor: PRIMARY }]} onPress={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.saveBtnText}>Guardar perfil</Text>}
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>

      {/* Secciones animadas */}
      <Animated.View style={{ opacity: sectionsAnim, transform: [{ translateY: sectionsSlide }] }}>

        <Text style={[s.sectionTitle, { color: TEXT_SECONDARY }]}>CUENTA</Text>
        <View style={[s.section, { backgroundColor: theme.card }]}>
          <TouchableOpacity style={s.row} onPress={() => setShowChangePassword(!showChangePassword)}>
            <View style={s.rowLeft}>
              <Lock size={18} color={PRIMARY} />
              <Text style={[s.rowText, { color: theme.text }]}>Cambiar contraseña</Text>
            </View>
            <ChevronRight size={18} color={TEXT_SECONDARY} />
          </TouchableOpacity>
          {showChangePassword && (
            <View style={s.passwordForm}>
              <TextInput style={[s.input, { backgroundColor: theme.background, color: theme.text }]} placeholder="Nueva contraseña" placeholderTextColor={TEXT_SECONDARY} secureTextEntry value={newPassword} onChangeText={setNewPassword} />
              <TextInput style={[s.input, { backgroundColor: theme.background, color: theme.text }]} placeholder="Confirmar contraseña" placeholderTextColor={TEXT_SECONDARY} secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
              <TouchableOpacity style={[s.saveBtn, { backgroundColor: PRIMARY }]} onPress={handleChangePassword} disabled={changingPassword}>
                {changingPassword ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.saveBtnText}>Guardar contraseña</Text>}
              </TouchableOpacity>
            </View>
          )}
          <View style={s.divider} />
          <TouchableOpacity style={s.row} onPress={handleSignOut}>
            <View style={s.rowLeft}>
              <LogOut size={18} color="#EF4444" />
              <Text style={[s.rowText, { color: "#EF4444" }]}>Cerrar sesión</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={[s.sectionTitle, { color: TEXT_SECONDARY }]}>APARIENCIA</Text>
        <View style={[s.section, { backgroundColor: theme.card }]}>
          <ThemeButton label="Claro" active={currentMode === "light"} onPress={() => onChangeMode("light")} icon={<Sun size={18} color={currentMode === "light" ? "#fff" : theme.text} />} styles={styles} theme={theme} />
          <View style={s.divider} />
          <ThemeButton label="Oscuro" active={currentMode === "dark"} onPress={() => onChangeMode("dark")} icon={<Moon size={18} color={currentMode === "dark" ? "#fff" : theme.text} />} styles={styles} theme={theme} />
        </View>

        <Text style={[s.sectionTitle, { color: TEXT_SECONDARY }]}>INFORMACIÓN</Text>
        <View style={[s.section, { backgroundColor: theme.card }]}>
          <View style={s.row}>
            <View style={s.rowLeft}><Info size={18} color={PRIMARY} /><Text style={[s.rowText, { color: theme.text }]}>Versión de la app</Text></View>
            <Text style={[s.rowValue, { color: TEXT_SECONDARY }]}>{APP_VERSION}</Text>
          </View>
          <View style={s.divider} />
          <View style={s.row}>
            <View style={s.rowLeft}><User size={18} color={PRIMARY} /><Text style={[s.rowText, { color: theme.text }]}>ID de usuario</Text></View>
            <Text style={[s.rowValue, { color: TEXT_SECONDARY }]} numberOfLines={1}>{user?.id?.slice(0, 8)}...</Text>
          </View>
        </View>

      </Animated.View>
    </ScrollView>
  );
};

const s = {
  userCard: { flexDirection: "row" as const, alignItems: "center" as const, marginHorizontal: 20, marginBottom: 12, padding: 16, borderRadius: 18, gap: 14 },
  avatarWrapper: { position: "relative" as const },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarFallback: { width: 56, height: 56, borderRadius: 28, justifyContent: "center" as const, alignItems: "center" as const },
  avatarLetter: { fontSize: 24, fontWeight: "800" as const, color: "#fff" },
  cameraBtn: { position: "absolute" as const, bottom: 0, right: 0, width: 20, height: 20, borderRadius: 10, backgroundColor: PRIMARY, justifyContent: "center" as const, alignItems: "center" as const },
  userInfo: { flex: 1 },
  userName: { fontSize: 17, fontWeight: "700" as const },
  userEmail: { fontSize: 13, marginTop: 2 },
  editCard: { marginHorizontal: 20, marginBottom: 20, borderRadius: 18, padding: 16, gap: 10 },
  editLabel: { fontSize: 12, fontWeight: "600" as const, letterSpacing: 0.5 },
  sectionTitle: { fontSize: 11, fontWeight: "700" as const, letterSpacing: 1, marginHorizontal: 20, marginBottom: 8, marginTop: 4 },
  section: { marginHorizontal: 20, borderRadius: 18, marginBottom: 20, overflow: "hidden" as const },
  row: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, paddingHorizontal: 16, paddingVertical: 14 },
  rowLeft: { flexDirection: "row" as const, alignItems: "center" as const, gap: 12 },
  rowText: { fontSize: 15, fontWeight: "500" as const },
  rowValue: { fontSize: 13 },
  divider: { height: 1, backgroundColor: "rgba(0,0,0,0.06)", marginHorizontal: 16 },
  passwordForm: { paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
  input: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginTop: 4 },
  saveBtn: { paddingVertical: 12, borderRadius: 12, alignItems: "center" as const, marginTop: 4 },
  saveBtnText: { color: "#fff", fontWeight: "700" as const, fontSize: 15 },
};

type ButtonProps = {
  label: string; active: boolean; onPress: () => void;
  icon: React.ReactNode; styles: ReturnType<typeof createStyles>; theme: any;
};

const ThemeButton = ({ label, active, onPress, icon, theme }: ButtonProps) => (
  <TouchableOpacity style={[s.row, active && { backgroundColor: PRIMARY }]} onPress={onPress} activeOpacity={0.85}>
    <View style={s.rowLeft}>
      {icon}
      <Text style={{ fontSize: 15, fontWeight: "500", color: active ? "#fff" : theme.text }}>{label}</Text>
    </View>
    {active && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" }} />}
  </TouchableOpacity>
);