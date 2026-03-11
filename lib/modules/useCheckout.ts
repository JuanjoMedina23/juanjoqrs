import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Transaction {
  id: string;
  amount: number;
  type: "payment" | "topup";
  date: string; // ISO string
  code: string; // QR raw code
}

const STORAGE_KEY_BALANCE = "wallet_balance";
const STORAGE_KEY_HISTORY = "wallet_history";
const INITIAL_BALANCE = 67000;
const TOPUP_AMOUNT = 100;

export function useCheckout() {
  const [balance, setBalance] = useState<number>(INITIAL_BALANCE);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar datos persistidos al montar
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

  const persistBalance = async (newBalance: number) => {
    await AsyncStorage.setItem(STORAGE_KEY_BALANCE, newBalance.toString());
  };

  const persistHistory = async (newHistory: Transaction[]) => {
    await AsyncStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(newHistory));
  };

  // Recargar saldo (botón simulado)
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
    await persistBalance(newBalance);
    await persistHistory(newHistory);
  }, [balance, history]);

  // Pagar con QR
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
      await persistBalance(newBalance);
      await persistHistory(newHistory);

      return { success: true };
    },
    [balance, history]
  );

  // Limpiar todo (útil para debug/settings)
  const clearAll = useCallback(async () => {
    setBalance(INITIAL_BALANCE);
    setHistory([]);
    await AsyncStorage.multiRemove([STORAGE_KEY_BALANCE, STORAGE_KEY_HISTORY]);
  }, []);

  return {
    balance,
    history,
    loading,
    topUp,
    pay,
    clearAll,
    TOPUP_AMOUNT,
  };
}