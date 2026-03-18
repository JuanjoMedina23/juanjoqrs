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
  onNavigateToRegister: () => void;
};

export default function LoginView({ onNavigateToRegister }: Props) {
  const { signIn } = useAuthContext();
  const { theme } = useTheme();
  const styles = createAuthStyles(theme);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Por favor completa todos los campos.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={styles.title}>Bienvenido 👋</Text>
          <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
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
                placeholder="••••••••"
                placeholderTextColor={`${theme.text}60`}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                onFocus={() => setFocusedInput("password")}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Iniciar sesión</Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Switch animado */}
        <Animated.View style={{ opacity: switchAnim }}>
          <TouchableOpacity onPress={onNavigateToRegister}>
            <Text style={styles.switchText}>
              ¿No tienes cuenta?{" "}
              <Text style={styles.switchLink}>Regístrate</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}