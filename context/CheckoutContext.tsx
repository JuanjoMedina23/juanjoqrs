import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import * as Notifications from "expo-notifications";
import { useAuthContext } from "@/context/AuthContext";
import { supabase } from "@/lib/core/auth/supabaseClient";
import { registerTransaction, parseQRPayload } from "@/lib/payments/registerTransaction";

// ── Tipos ────────────────────────────────────────────────────────────────────
export interface Transaction {
  id: string;
  amount: number;
  type: "payment" | "topup" | "charge";
  date: string;
  code: string;
  counterpartyEmail?: string;
  counterpartyName?: string;
}

const TOPUP_AMOUNT = 100;

type CheckoutContextType = {
  balance: number;
  history: Transaction[];
  loading: boolean;
  topUp: () => Promise<void>;
  pay: (code: string) => Promise<{ success: boolean; error?: string }>;
  clearAll: () => Promise<void>;
  refresh: () => Promise<void>;
  TOPUP_AMOUNT: number;
};

// ── Context ──────────────────────────────────────────────────────────────────
const CheckoutContext = createContext<CheckoutContextType | null>(null);

// ── Notificaciones ───────────────────────────────────────────────────────────
async function sendTopUpNotification(amount: number, newBalance: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "💰 Recarga exitosa",
      body: `Se han agregado $${amount.toFixed(2)} a tu cuenta. Saldo actual: $${newBalance.toFixed(2)}`,
      sound: "sonido_verificacion.mp3",
    },
    trigger: null,
  });
}

async function sendPaymentNotification(amount: number, toName: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "✅ Pago realizado",
      body: `Pagaste $${amount.toFixed(2)} a ${toName}.`,
      sound: "sonido_verificacion.mp3",
    },
    trigger: null,
  });
}

// ── Provider ─────────────────────────────────────────────────────────────────
export function CheckoutProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext();

  const [balance, setBalance] = useState<number>(0);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Obtener saldo real desde wallets ──────────────────────────────────────
  const fetchBalance = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    if (error) {
      // Si no existe el wallet aún, crearlo con saldo 0
      if (error.code === "PGRST116") {
        await supabase
          .from("wallets")
          .insert({ user_id: user.id, balance: 0 });
        setBalance(0);
      } else {
        console.error("Error cargando wallet:", error.message);
      }
      return;
    }

    setBalance(parseFloat(data.balance.toFixed(2)));
  }, [user]);

  // ── Obtener historial de transacciones ────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("transactions")
      .select(`
        id,
        amount,
        payer_id,
        receiver_id,
        status,
        created_at,
        payer_profile:profiles!transactions_payer_id_fkey(email, full_name),
        receiver_profile:profiles!transactions_receiver_id_fkey(email, full_name)
      `)
      .or(`payer_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error cargando historial:", error.message);
      return;
    }

    const mapped: Transaction[] = (data ?? []).map((tx: any) => {
      const isPayer = tx.payer_id === user.id;
      const profile = isPayer ? tx.receiver_profile : tx.payer_profile;

      return {
        id: tx.id,
        amount: tx.amount,
        type: isPayer ? "payment" : "charge",
        date: tx.created_at,
        code: isPayer ? "QR_PAGO" : "QR_COBRO",
        counterpartyEmail: profile?.email ?? undefined,
        counterpartyName: profile?.full_name?.split(" ")[0] ?? undefined,
      };
    });

    setHistory(mapped);
  }, [user]);

  // Cargar todo al montar / cambiar usuario
  const fetchData = useCallback(async () => {
    await Promise.all([fetchBalance(), fetchHistory()]);
  }, [fetchBalance, fetchHistory]);

  useEffect(() => {
    setLoading(true);
    setBalance(0);
    setHistory([]);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  // ── Recarga: suma al wallet en Supabase ───────────────────────────────────
  const topUp = useCallback(async () => {
    if (!user) return;

    const newBalance = parseFloat((balance + TOPUP_AMOUNT).toFixed(2));

    const { error } = await supabase
      .from("wallets")
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (error) {
      console.error("Error al recargar:", error.message);
      return;
    }

    // Reflejar en estado local inmediatamente
    setBalance(newBalance);

    // Agregar al historial local (visual)
    const tx: Transaction = {
      id: Date.now().toString(),
      amount: TOPUP_AMOUNT,
      type: "topup",
      date: new Date().toISOString(),
      code: "RECARGA",
    };
    setHistory((prev) => [tx, ...prev]);

    await sendTopUpNotification(TOPUP_AMOUNT, newBalance);
  }, [user, balance]);

  // ── Pagar con QR ──────────────────────────────────────────────────────────
  const pay = useCallback(
    async (code: string): Promise<{ success: boolean; error?: string }> => {
      if (!user) return { success: false, error: "No hay sesión activa." };

      // 1. Validar el payload del QR
      let payload;
      try {
        payload = parseQRPayload(code);
      } catch {
        return { success: false, error: "QR inválido: no es un código de pago." };
      }

      const amount = parseFloat(payload.amount);

      if (isNaN(amount) || amount <= 0) {
        return { success: false, error: "El monto del QR no es válido." };
      }

      if (amount > balance) {
        return { success: false, error: "Saldo insuficiente." };
      }

      try {
        // 2. Registrar la transacción en Supabase
        await registerTransaction(code, user.id);

        // 3. Descontar del wallet del pagador
        const newPayerBalance = parseFloat((balance - amount).toFixed(2));
        await supabase
          .from("wallets")
          .update({
            balance: newPayerBalance,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        // 4. Sumar al wallet del cobrador
        const { data: receiverWallet } = await supabase
          .from("wallets")
          .select("balance")
          .eq("user_id", payload.receiverId)
          .single();

        if (receiverWallet) {
          const receiverNewBalance = parseFloat(
            (receiverWallet.balance + amount).toFixed(2)
          );
          await supabase
            .from("wallets")
            .update({
              balance: receiverNewBalance,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", payload.receiverId);
        }

        // 5. Refrescar estado desde Supabase
        await fetchData();

        // 6. Notificación al pagador con nombre del cobrador
        const receiverProfile = history.find(
          (t) => t.type === "charge"
        )?.counterpartyName;
        await sendPaymentNotification(amount, receiverProfile ?? "el cobrador");

        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message ?? "Error al procesar el pago." };
      }
    },
    [user, balance, history, fetchData]
  );

  // ── Limpiar estado local (debug) ──────────────────────────────────────────
  const clearAll = useCallback(async () => {
    setBalance(0);
    setHistory([]);
  }, []);

  // ── Refresh manual ────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return (
    <CheckoutContext.Provider
      value={{ balance, history, loading, topUp, pay, clearAll, refresh, TOPUP_AMOUNT }}
    >
      {children}
    </CheckoutContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error("useCheckout debe usarse dentro de CheckoutProvider");
  }
  return context;
}