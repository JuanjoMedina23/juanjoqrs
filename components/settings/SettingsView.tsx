import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import {
  Sun,
  Moon,
  ArrowLeft,
  LogOut,
  Lock,
  User,
  Info,
  ChevronRight,
} from "lucide-react-native";
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

  const displayName = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "Usuario";
  const avatarUrl = user?.user_metadata?.avatar_url ?? null;

  const handleSignOut = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro que quieres cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Cerrar sesión", style: "destructive", onPress: signOut },
      ]
    );
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Error", "Por favor completa ambos campos.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Éxito", "Contraseña actualizada correctamente.");
      setShowChangePassword(false);
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración</Text>
      </View>

      {/* Avatar + info usuario */}
      <View style={[s.userCard, { backgroundColor: theme.card }]}>
        <View style={s.avatarWrapper}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={s.avatar} />
          ) : (
            <View style={[s.avatarFallback, { backgroundColor: PRIMARY }]}>
              <Text style={s.avatarLetter}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View style={s.userInfo}>
          <Text style={[s.userName, { color: theme.text }]}>{displayName}</Text>
          <Text style={[s.userEmail, { color: TEXT_SECONDARY }]}>{user?.email}</Text>
        </View>
      </View>

      {/* Cambiar contraseña */}
      <Text style={[s.sectionTitle, { color: TEXT_SECONDARY }]}>CUENTA</Text>
      <View style={[s.section, { backgroundColor: theme.card }]}>
        <TouchableOpacity
          style={s.row}
          onPress={() => setShowChangePassword(!showChangePassword)}
        >
          <View style={s.rowLeft}>
            <Lock size={18} color={PRIMARY} />
            <Text style={[s.rowText, { color: theme.text }]}>Cambiar contraseña</Text>
          </View>
          <ChevronRight size={18} color={TEXT_SECONDARY} />
        </TouchableOpacity>

        {showChangePassword && (
          <View style={s.passwordForm}>
            <TextInput
              style={[s.input, { backgroundColor: theme.background, color: theme.text }]}
              placeholder="Nueva contraseña"
              placeholderTextColor={TEXT_SECONDARY}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              style={[s.input, { backgroundColor: theme.background, color: theme.text }]}
              placeholder="Confirmar contraseña"
              placeholderTextColor={TEXT_SECONDARY}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity
              style={[s.saveBtn, { backgroundColor: PRIMARY }]}
              onPress={handleChangePassword}
              disabled={changingPassword}
            >
              {changingPassword ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={s.saveBtnText}>Guardar contraseña</Text>
              )}
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

      {/* Tema */}
      <Text style={[s.sectionTitle, { color: TEXT_SECONDARY }]}>APARIENCIA</Text>
      <View style={[s.section, { backgroundColor: theme.card }]}>
        <ThemeButton
          label="Claro"
          active={currentMode === "light"}
          onPress={() => onChangeMode("light")}
          icon={<Sun size={18} color={currentMode === "light" ? "#fff" : theme.text} />}
          styles={styles}
          theme={theme}
        />
        <View style={s.divider} />
        <ThemeButton
          label="Oscuro"
          active={currentMode === "dark"}
          onPress={() => onChangeMode("dark")}
          icon={<Moon size={18} color={currentMode === "dark" ? "#fff" : theme.text} />}
          styles={styles}
          theme={theme}
        />
      </View>

      {/* Info de la app */}
      <Text style={[s.sectionTitle, { color: TEXT_SECONDARY }]}>INFORMACIÓN</Text>
      <View style={[s.section, { backgroundColor: theme.card }]}>
        <View style={s.row}>
          <View style={s.rowLeft}>
            <Info size={18} color={PRIMARY} />
            <Text style={[s.rowText, { color: theme.text }]}>Versión de la app</Text>
          </View>
          <Text style={[s.rowValue, { color: TEXT_SECONDARY }]}>{APP_VERSION}</Text>
        </View>
        <View style={s.divider} />
        <View style={s.row}>
          <View style={s.rowLeft}>
            <User size={18} color={PRIMARY} />
            <Text style={[s.rowText, { color: theme.text }]}>ID de usuario</Text>
          </View>
          <Text style={[s.rowValue, { color: TEXT_SECONDARY }]} numberOfLines={1}>
            {user?.id?.slice(0, 8)}...
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

// Estilos locales
const s = {
  userCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 18,
    gap: 14,
  },
  avatarWrapper: {},
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  avatarLetter: {
    fontSize: 24,
    fontWeight: "800" as const,
    color: "#fff",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: "700" as const,
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 1,
    marginHorizontal: 20,
    marginBottom: 8,
    marginTop: 4,
  },
  section: {
    marginHorizontal: 20,
    borderRadius: 18,
    marginBottom: 20,
    overflow: "hidden" as const,
  },
  row: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  rowText: {
    fontSize: 15,
    fontWeight: "500" as const,
  },
  rowValue: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginHorizontal: 16,
  },
  passwordForm: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginTop: 4,
  },
  saveBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center" as const,
    marginTop: 4,
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "700" as const,
    fontSize: 15,
  },
};

type ButtonProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  icon: React.ReactNode;
  styles: ReturnType<typeof createStyles>;
  theme: any;
};

const ThemeButton = ({ label, active, onPress, icon, theme }: ButtonProps) => {
  return (
    <TouchableOpacity
      style={[s.row, active && { backgroundColor: PRIMARY }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={s.rowLeft}>
        {icon}
        <Text style={{ fontSize: 15, fontWeight: "500", color: active ? "#fff" : theme.text }}>
          {label}
        </Text>
      </View>
      {active && (
        <View style={{
          width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff"
        }} />
      )}
    </TouchableOpacity>
  );
};