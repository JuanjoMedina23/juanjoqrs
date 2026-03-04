import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Sun, Moon, Monitor, ArrowLeft } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { createStyles } from "./settings.styles";

type Mode = "normal"| "light" | "dark";

type Props = {
  currentMode: Mode;
  onChangeMode: (mode: Mode) => void;
  onBackPress: () => void;
};

export const SettingsView = ({
  currentMode,
  onChangeMode,
  onBackPress,
}: Props) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBackPress}
        >
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Configuración</Text>
      </View>

      {/* Body */}
      <View style={styles.content}>
        <Text style={styles.title}>Modo de Apariencia</Text>


        <ThemeButton
          label="Claro"
          active={currentMode === "light"}
          onPress={() => onChangeMode("light")}
          icon={<Sun size={20} color={theme.text} />}
          styles={styles}
        />

        <ThemeButton
          label="Oscuro"
          active={currentMode === "dark"}
          onPress={() => onChangeMode("dark")}
          icon={<Moon size={20} color={theme.text} />}
          styles={styles}
        />
      </View>
    </View>
  );
};

type ButtonProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  icon: React.ReactNode;
  styles: ReturnType<typeof createStyles>;
};

const ThemeButton = ({
  label,
  active,
  onPress,
  icon,
  styles,
}: ButtonProps) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        active && styles.activeButton,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {icon}
      <Text
        style={[
          styles.buttonText,
          active && styles.activeText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};