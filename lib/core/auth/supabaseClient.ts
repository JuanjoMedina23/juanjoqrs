import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === "web" ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Limpiar sesión inválida automáticamente
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "TOKEN_REFRESHED" && !session) {
    AsyncStorage.multiRemove([
      "supabase.auth.token",
      "sb-" + supabaseUrl.split("//")[1].split(".")[0] + "-auth-token",
    ]);
    supabase.auth.signOut();
  }
});