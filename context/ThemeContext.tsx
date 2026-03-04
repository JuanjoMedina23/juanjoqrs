import {createContext,useContext,useEffect,useState} from "react";
  import { Appearance } from "react-native";
  import AsyncStorage from "@react-native-async-storage/async-storage";
  import { lightTheme, darkTheme, ThemeType } from "../lib/themes/theme";
  
  type Mode = "normal" | "light" | "dark";
  
  type ThemeContextType = {
    theme: ThemeType;
    mode: Mode;
    setMode: (mode: Mode) => void;
  };
  
  const ThemeContext = createContext<ThemeContextType | null>(
    null
  );
  
  const STORAGE_KEY = "@app_theme_mode";
  
  export const ThemeProvider = ({
    children,
  }: {
    children: React.ReactNode;
  }) => {
    const [mode, setModeState] = useState<Mode>("normal");
    const [theme, setTheme] = useState<ThemeType>(lightTheme);
  
    // Cargar modo guardado
    useEffect(() => {
      const loadTheme = async () => {
        const savedMode = await AsyncStorage.getItem(
          STORAGE_KEY
        );
  
        if (savedMode) {
          setModeState(savedMode as Mode);
          applyTheme(savedMode as Mode);
        } else {
          applyTheme("normal");
        }
      };
  
      loadTheme();
    }, []);
  
    const applyTheme = (selectedMode: Mode) => {
      if (selectedMode === "light") {
        setTheme(lightTheme);
      } else if (selectedMode === "dark") {
        setTheme(darkTheme);
      } else {
        const system = Appearance.getColorScheme();
        setTheme(system === "dark" ? darkTheme : lightTheme);
      }
    };
  
    const setMode = async (newMode: Mode) => {
      setModeState(newMode);
      applyTheme(newMode);
      await AsyncStorage.setItem(STORAGE_KEY, newMode);
    };
  
    return (
      <ThemeContext.Provider
        value={{ theme, mode, setMode }}
      >
        {children}
      </ThemeContext.Provider>
    );
  };
  
  export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
      throw new Error(
        "useTheme debe usarse dentro de ThemeProvider"
      );
    }
    return context;
  };