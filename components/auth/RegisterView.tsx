import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from "react-native";
import { useAuthContext } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { createAuthStyles } from "./auth.styles";

type Props = {
  onNavigateToLogin: () => void;
};

export default function RegisterView({ onNavigateToLogin }: Props) {
  const { signUp } = useAuthContext();
  const { theme } = useTheme();
  const styles = createAuthStyles(theme);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Animaciones
  const logoAnim = useRef(new Animated.Value(0)).current;
  const logoSlide = useRef(new Animated.Value(-30)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(40)).current;
  const switchAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(logoSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(cardSlide, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]),
      Animated.timing(switchAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      setError("Por favor completa todos los campos.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await signUp(email.trim(), password);
      setRegistered(true);
    } catch (err: any) {
      setError(err.message || "Error al registrarse.");
    } finally {
      setLoading(false);
    }
  };

  // Pantalla de éxito tras registro
  if (registered) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Animated.View
            style={[styles.logoContainer, { opacity: logoAnim, transform: [{ translateY: logoSlide }] }]}
          >
            <Text style={styles.title}>Revisa tu correo 📬</Text>
            <Text style={styles.subtitle}>
              Te enviamos un enlace de verificación a{"\n"}
              <Text style={{ fontWeight: "700" }}>{email}</Text>
            </Text>
          </Animated.View>
          <Animated.View style={{ opacity: cardAnim, transform: [{ translateY: cardSlide }] }}>
            <View style={styles.card}>
              <Text style={{ color: theme.text, fontSize: 15, textAlign: "center", lineHeight: 22 }}>
                Toca el enlace del correo para verificar tu cuenta y acceder a JuanjoQRs.
              </Text>
            </View>
          </Animated.View>
          <Animated.View style={{ opacity: switchAnim }}>
            <TouchableOpacity onPress={onNavigateToLogin}>
              <Text style={styles.switchText}>
                ¿Ya verificaste?{" "}
                <Text style={styles.switchLink}>Inicia sesión</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo animado */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoAnim,
              transform: [{ translateY: logoSlide }],
            },
          ]}
        >
          <Text style={styles.title}>Crear cuenta ✨</Text>
          <Text style={styles.subtitle}>Regístrate para comenzar</Text>
        </Animated.View>

        {/* Card animada */}
        <Animated.View
          style={{
            opacity: cardAnim,
            transform: [{ translateY: cardSlide }],
          }}
        >
          <View style={styles.card}>
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Correo electrónico</Text>
              <TextInput
                style={[styles.input, focusedInput === "email" && styles.inputFocused]}
                placeholder="correo@ejemplo.com"
                placeholderTextColor={`${theme.text}60`}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocusedInput("email")}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={[styles.input, focusedInput === "password" && styles.inputFocused]}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={`${theme.text}60`}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                onFocus={() => setFocusedInput("password")}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Confirmar contraseña</Text>
              <TextInput
                style={[styles.input, focusedInput === "confirm" && styles.inputFocused]}
                placeholder="Repite tu contraseña"
                placeholderTextColor={`${theme.text}60`}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                onFocus={() => setFocusedInput("confirm")}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Registrarse</Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Switch animado */}
        <Animated.View style={{ opacity: switchAnim }}>
          <TouchableOpacity onPress={onNavigateToLogin}>
            <Text style={styles.switchText}>
              ¿Ya tienes cuenta?{" "}
              <Text style={styles.switchLink}>Inicia sesión</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}