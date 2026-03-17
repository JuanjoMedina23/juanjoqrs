import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

export interface Transaction {
  id: string;
  amount: number;
  type: "payment" | "topup";
  date: string;
  code: string;
}

const STORAGE_KEY_BALANCE = "wallet_balance";
const STORAGE_KEY_HISTORY = "wallet_history";
const INITIAL_BALANCE = 67000;
const TOPUP_AMOUNT = 100;

type CheckoutContextType = {
  balance: number;
  history: Transaction[];
  loading: boolean;
  topUp: () => Promise<void>;
  pay: (code: string) => Promise<{ success: boolean; error?: string }>;
  clearAll: () => Promise<void>;
  TOPUP_AMOUNT: number;
};

const CheckoutContext = createContext<CheckoutContextType | null>(null);

async function sendTopUpNotification(amount: number, newBalance: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "💰 Recarga exitosa",
      body: `Se han agregado $${amount.toFixed(2)} a su cuenta. Saldo actual: $${newBalance.toFixed(2)}`,
      sound: true,
    },
    trigger: null,
  });
}

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState<number>(INITIAL_BALANCE);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [storedBalance, storedHistory] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_BALANCE),
          AsyncStorage.getItem(STORAGE_KEY_HISTORY),
        ]);
        if (storedBalance !== null) setBalance(parseFloat(storedBalance));
        if (storedHistory !== null) setHistory(JSON.parse(storedHistory));
      } catch (e) {
        console.error("Error cargando wallet:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const topUp = useCallback(async () => {
    const newBalance = balance + TOPUP_AMOUNT;
    const tx: Transaction = {
      id: Date.now().toString(),
      amount: TOPUP_AMOUNT,
      type: "topup",
      date: new Date().toISOString(),
      code: "RECARGA",
    };
    const newHistory = [tx, ...history];

    setBalance(newBalance);
    setHistory(newHistory);

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEY_BALANCE, newBalance.toString()),
      AsyncStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(newHistory)),
      sendTopUpNotification(TOPUP_AMOUNT, newBalance),
    ]);
  }, [balance, history]);

  const pay = useCallback(
    async (code: string): Promise<{ success: boolean; error?: string }> => {
      const amount = parseFloat(code);

      if (isNaN(amount) || amount <= 0) {
        return { success: false, error: "QR inválido: no contiene un monto válido." };
      }

      if (amount > balance) {
        return { success: false, error: "Saldo insuficiente." };
      }

      const newBalance = parseFloat((balance - amount).toFixed(2));
      const tx: Transaction = {
        id: Date.now().toString(),
        amount,
        type: "payment",
        date: new Date().toISOString(),
        code,
      };
      const newHistory = [tx, ...history];

      setBalance(newBalance);
      setHistory(newHistory);

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY_BALANCE, newBalance.toString()),
        AsyncStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(newHistory)),
      ]);

      return { success: true };
    },
    [balance, history]
  );

  const clearAll = useCallback(async () => {
    setBalance(INITIAL_BALANCE);
    setHistory([]);
    await AsyncStorage.multiRemove([STORAGE_KEY_BALANCE, STORAGE_KEY_HISTORY]);
  }, []);

  return (
    <CheckoutContext.Provider
      value={{ balance, history, loading, topUp, pay, clearAll, TOPUP_AMOUNT }}
    >
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error("useCheckout debe usarse dentro de CheckoutProvider");
  }
  return context;
}